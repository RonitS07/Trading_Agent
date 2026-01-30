import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';



export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;

    try {
        // 1. Fetch Open Orders
        const openOrders = await prisma.trade.findMany({
            where: {
                userId,
                status: 'OPEN'
            }
        });

        if (openOrders.length === 0) {
            return NextResponse.json([]);
        }

        // 2. Batch Price Fetch
        const symbolsToCheck = [...new Set(openOrders.map(o => o.symbol))];
        const quoteMap = {};

        try {
            const query = symbolsToCheck.join(',');
            // Reuse the quote logic directly or fetch the endpoint internally?
            // Since this is server-side, it's better to reuse a helper if we had one.
            // But for now, we'll fetch the yahoo endpoint directly as `getCurrentPrice` did, but in batch.
            const res = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${query}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                next: { revalidate: 0 }
            });
            const data = await res.json();
            const results = data.quoteResponse?.result || [];
            results.forEach(q => {
                quoteMap[q.symbol] = q.regularMarketPrice;
            });
        } catch (e) {
            // console.error("Batch price check failed", e);
        }

        // 3. Execution Check
        const updatedOrders = [];
        let executedCount = 0;

        for (const order of openOrders) {
            let shouldExecute = false;
            const currentPrice = quoteMap[order.symbol];

            if (currentPrice) {
                if (order.type === 'LIMIT' && order.limitPrice) {
                    if (order.action === 'BUY' && currentPrice <= order.limitPrice) shouldExecute = true;
                    if (order.action === 'SELL' && currentPrice >= order.limitPrice) shouldExecute = true;
                }
                // Stop Loss Logic (simplified)
                if (order.type === 'SL' && order.stopPrice) {
                    if (order.action === 'SELL' && currentPrice <= order.stopPrice) shouldExecute = true;
                }
            }

            if (shouldExecute) {
                // EXECUTE TRANSACTION
                await prisma.$transaction(async (tx) => {
                    // Update Order Status
                    await tx.trade.update({
                        where: { id: order.id },
                        data: { status: 'EXECUTED', price: order.limitPrice || order.stopPrice || currentPrice } // Execute at limit/stop price or better
                    });

                    // Update Portfolio
                    // Fetch existing holding
                    const existing = await tx.portfolio.findUnique({
                        where: { userId_symbol: { userId, symbol: order.symbol } }
                    });

                    if (order.action === 'BUY') {
                        const price = order.limitPrice || currentPrice;
                        if (existing) {
                            const totalQty = existing.qty + order.qty;
                            const totalCostBasis = (existing.qty * existing.avgCost) + (order.qty * price);
                            const newAvg = totalCostBasis / totalQty;
                            await tx.portfolio.update({
                                where: { id: existing.id },
                                data: { qty: totalQty, avgCost: newAvg }
                            });
                        } else {
                            await tx.portfolio.create({
                                data: { userId, symbol: order.symbol, qty: order.qty, avgCost: price }
                            });
                        }
                    } else {
                        // SELL
                        if (existing) {
                            const newQty = existing.qty - order.qty;
                            if (newQty <= 0) {
                                await tx.portfolio.delete({ where: { id: existing.id } });
                            } else {
                                await tx.portfolio.update({
                                    where: { id: existing.id },
                                    data: { qty: newQty }
                                });
                            }

                            // Return Proceeds to Balance
                            // Assuming we deducted stock, we need to add cash
                            const proceeds = order.qty * (order.limitPrice || order.stopPrice || currentPrice);
                            const user = await tx.user.findUnique({ where: { id: userId } });
                            await tx.user.update({
                                where: { id: userId },
                                data: { balance: user.balance + proceeds }
                            });
                        }
                    }
                });
                executedCount++;
            } else {
                updatedOrders.push(order);
            }
        }

        return NextResponse.json(updatedOrders);

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { orderId } = await request.json();

        const order = await prisma.trade.findUnique({ where: { id: orderId } });
        if (!order || order.userId !== session.user.id) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.status !== 'OPEN') {
            return NextResponse.json({ error: 'Cannot cancel closed order' }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            // Refund Balance for BUY orders
            if (order.action === 'BUY') {
                const refundAmount = order.limitPrice * order.qty; // Refund the blocked amount (ignoring tax diff for now to keep simple)
                // Actually in trade/route we deducted (limitPrice * qty) + tax. 
                // We should refund `order.cost` if we stored it?
                // Schema has `cost`. Let's assume `cost` was the total deducted.
                // Re-fetch user to update balance
                const user = await tx.user.findUnique({ where: { id: session.user.id } });
                await tx.user.update({
                    where: { id: session.user.id },
                    data: { balance: user.balance + (order.cost || 0) }
                });
            }

            // Mark Cancelled
            await tx.trade.update({
                where: { id: orderId },
                data: { status: 'CANCELLED' }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
