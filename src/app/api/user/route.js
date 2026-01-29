import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    try {
        const [user, tradeCount, history] = await prisma.$transaction([
            prisma.user.findUnique({
                where: { id: userId },
                include: {
                    portfolio: true,
                    trades: {
                        take: 10,
                        orderBy: { timestamp: 'desc' }
                    }
                }
            }),
            prisma.trade.count({ where: { userId } }),
            prisma.history.findMany({ where: { userId } })
        ]);

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Sanitize
        // Sanitize
        const { password, ...safeUser } = user;

        // Calculate Stats
        const totalDetails = {
            totalTrades: tradeCount,
            winRate: 0,
            health: 'B'
        };

        if (history.length > 0) {
            const wins = history.filter(h => h.pl > 0).length;
            totalDetails.winRate = Math.round((wins / history.length) * 100);

            if (totalDetails.winRate >= 80) totalDetails.health = 'A+';
            else if (totalDetails.winRate >= 60) totalDetails.health = 'A';
            else if (totalDetails.winRate >= 40) totalDetails.health = 'B';
            else totalDetails.health = 'C';
        } else {
            // Default if no history but has trades (new user)
            if (tradeCount > 0) totalDetails.health = 'A';
        }

        return NextResponse.json({ ...safeUser, ...totalDetails });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
