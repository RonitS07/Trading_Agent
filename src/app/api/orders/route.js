import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

async function getCurrentPrice(symbol) {
    try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 0 }
        });
        const data = await res.json();
        return data.chart?.result?.[0]?.meta?.regularMarketPrice || null;
    } catch { return null; }
}

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

        // 2. Lazy Execution Check
        // For each open order, check current price and execute if condition met
        const updatedOrders = [];
        let executedCount = 0;

        for (const order of openOrders) {
            let shouldExecute = false;
            const currentPrice = await getCurrentPrice(order.symbol);

            if (currentPrice) {
                if (order.type === 'LIMIT' && order.limitPrice) {
                    if (order.action === 'BUY' && currentPrice <= order.limitPrice) shouldExecute = true;
                    if (order.action === 'SELL' && currentPrice >= order.limitPrice) shouldExecute = true;
                }
                // Add SL logic if needed
            }

            if (shouldExecute) {
                // EXECUTE TRANSACTION
                await prisma.$transaction(async (tx) => {
                    // Update Order Status
                    await tx.trade.update({
                        where: { id: order.id },
                        data: { status: 'EXECUTED', price: order.limitPrice } // Execute at limit price
                    });

                    // Update Portfolio
                    // Fetch user again to be safe? Or assume logic holds.
                    // Need to replicate portfolio logic from trade/route.js
                    // Ideally this logic should be a shared lib function.
                    // For MVP, we duplicate briefly or keep concise.

                    const existing = await tx.portfolio.findUnique({
                        where: { userId_symbol: { userId, symbol: order.symbol } }
                    });

                    if (order.action === 'BUY') {
                        if (existing) {
                            const totalQty = existing.qty + order.qty;
                            const totalCostBasis = (existing.qty * existing.avgCost) + (order.qty * order.limitPrice);
                            const newAvg = totalCostBasis / totalQty;
                            await tx.portfolio.update({
                                where: { id: existing.id },
                                data: { qty: totalQty, avgCost: newAvg }
                            });
                        } else {
                            await tx.portfolio.create({
                                data: { userId, symbol: order.symbol, qty: order.qty, avgCost: order.limitPrice }
                            });
                        }
                    } else {
                        // SELL
                        if (existing) {
                            const newQty = existing.qty - order.qty;
                            if (newQty <= 0) { // Safety <=
                                await tx.portfolio.delete({ where: { id: existing.id } });
                            } else {
                                await tx.portfolio.update({
                                    where: { id: existing.id },
                                    data: { qty: newQty }
                                });
                            }
                        }
                    }
                });
                executedCount++;
            } else {
                updatedOrders.push(order);
            }
        }

        // Return remaining OPEN orders
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
