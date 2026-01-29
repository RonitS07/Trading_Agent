import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const watchlist = await prisma.watchlist.findMany({
            where: { userId: session.user.id },
            select: { symbol: true }
        });
        return NextResponse.json(watchlist.map(w => w.symbol));
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { symbol, action } = await request.json();

        if (action === 'ADD') {
            await prisma.watchlist.create({
                data: {
                    userId: session.user.id,
                    symbol
                }
            });
        } else if (action === 'REMOVE') {
            await prisma.watchlist.deleteMany({
                where: {
                    userId: session.user.id,
                    symbol
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        // Ignore unique constraint errors (already added)
        if (error.code === 'P2002') return NextResponse.json({ success: true });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
