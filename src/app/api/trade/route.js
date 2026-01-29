import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

async function getCurrentPrice(symbol) {
    try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 0 } // No cache for trade execution
        });
        const data = await res.json();
        return data.chart?.result?.[0]?.meta?.regularMarketPrice || null;
    } catch { return null; }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { userId, symbol, action, qty, password, type = 'MARKET', limitPrice, stopPrice, targetPrice } = body;

        if (!userId || !symbol || !action || !qty || qty <= 0) {
            return NextResponse.json({ error: 'Invalid trade params' }, { status: 400 });
        }

        // 1. Fetch User & Balance
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { portfolio: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify Password
        if (!password || !(await bcrypt.compare(password, user.password))) {
            return NextResponse.json({ error: 'Invalid Security Key (Password)' }, { status: 401 });
        }

        // 2. Get Live Price
        const price = await getCurrentPrice(symbol);
        if (!price) return NextResponse.json({ error: 'Market data unavailable' }, { status: 503 });

        // LIMIT ORDER CHECK
        let status = 'EXECUTED';
        let execPrice = price;

        if (type === 'LIMIT' && limitPrice) {
            const isBuy = action === 'BUY';
            const conditionMet = isBuy ? (price <= limitPrice) : (price >= limitPrice);

            if (conditionMet) {
                execPrice = limitPrice; // Execute at limit price (or better, but for simplicity we use Limit)
                // Realistically exchange gives you best available. Here we assume you get your Limit.
            } else {
                status = 'OPEN';
                execPrice = limitPrice; // Store intended price
            }
        } else if (type === 'SL' && stopPrice) {
            // Basic Stop Loss logic (Trigger not met yet usually)
            // If Current Price > SL (Buy), we wait? No, SL is usually sell below X.
            // Let's assume SL is entered as a Pending Stop Order.
            status = 'OPEN';
            execPrice = stopPrice;
        }

        // 3. Calculate Values (Block funds based on Limit Price)
        const totalValue = execPrice * qty;

        // Taxes (approximate for India)
        const stt = totalValue * 0.001;
        const otherCharges = totalValue * 0.0005;
        const taxes = stt + otherCharges;
        const totalCost = totalValue + taxes;
        const totalProceeds = totalValue - taxes;

        // 4. Validate Funds / Holdings
        if (action === 'BUY') {
            if (user.balance < totalCost) {
                return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
            }
        } else if (action === 'SELL') {
            const holding = user.portfolio.find(p => p.symbol === symbol);
            if (!holding || holding.qty < qty) {
                return NextResponse.json({ error: 'Insufficient holdings' }, { status: 400 });
            }
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // 5. Execute Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update Balance
            const newBalance = action === 'BUY'
                ? user.balance - totalCost
                : user.balance + totalProceeds;

            await tx.user.update({
                where: { id: userId },
                data: { balance: newBalance }
            });

            // Register Trade
            await tx.trade.create({
                data: {
                    userId,
                    symbol,
                    action,
                    price: execPrice,
                    qty,
                    cost: taxes,
                    type,
                    limitPrice,
                    stopPrice,
                    targetPrice,
                    status // OPEN or EXECUTED
                }
            });

            // Update Portfolio ONLY if EXECUTED
            if (status === 'EXECUTED') {
                const existing = user.portfolio.find(p => p.symbol === symbol);
                if (action === 'BUY') {
                    if (existing) {
                        const totalQty = existing.qty + qty;
                        const totalCostBasis = (existing.qty * existing.avgCost) + totalValue;
                        const newAvg = totalCostBasis / totalQty;

                        await tx.portfolio.update({
                            where: { id: existing.id },
                            data: { qty: totalQty, avgCost: newAvg }
                        });
                    } else {
                        await tx.portfolio.create({
                            data: { userId, symbol, qty, avgCost: execPrice }
                        });
                    }
                } else {
                    // SELL (Assuming holdings check passed)
                    const newQty = existing.qty - qty;
                    if (newQty === 0) {
                        await tx.portfolio.delete({ where: { id: existing.id } });
                    } else {
                        await tx.portfolio.update({
                            where: { id: existing.id },
                            data: { qty: newQty }
                        });
                    }
                }
            }

            return { newBalance, status };
        });

        return NextResponse.json({ success: true, balance: result.newBalance, status: result.status, price });

    } catch (error) {
        // console.error("Trade Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
