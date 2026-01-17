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
        const { userId, symbol, action, qty, password } = body;

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

        // 3. Calculate Values
        const totalValue = price * qty;
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
                    price,
                    qty,
                    cost: taxes // Store taxes/fees cost? Schema says 'cost'. Or total spent? 
                    // Schema comment says "Total cost including tax". 
                    // For SELL, it's confusing. Let's store the Transaction Amount (Total)
                    // Actually, let's follow the schema intent.
                }
            });

            // Update Portfolio
            const existing = user.portfolio.find(p => p.symbol === symbol);
            if (action === 'BUY') {
                if (existing) {
                    const totalQty = existing.qty + qty;
                    const totalCostBasis = (existing.qty * existing.avgCost) + totalValue; // Avg cost usually excludes tax for P&L, but includes for tax purposes? 
                    // Let's stick to gross price for metrics simplicity
                    const newAvg = totalCostBasis / totalQty;

                    await tx.portfolio.update({
                        where: { id: existing.id },
                        data: { qty: totalQty, avgCost: newAvg }
                    });
                } else {
                    await tx.portfolio.create({
                        data: { userId, symbol, qty, avgCost: price }
                    });
                }
            } else {
                // SELL
                const newQty = existing.qty - qty;
                if (newQty === 0) {
                    await tx.portfolio.delete({ where: { id: existing.id } });
                } else {
                    await tx.portfolio.update({
                        where: { id: existing.id },
                        data: { qty: newQty } // Avg cost doesn't change on sell
                    });
                }

                // Record Realized P&L in History? (Not in this simple logic yet)
            }

            return { newBalance };
        });

        return NextResponse.json({ success: true, balance: result.newBalance, price });

    } catch (error) {
        // console.error("Trade Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
