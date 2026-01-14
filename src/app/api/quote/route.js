import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 60 } // Cache for 60 seconds
        });

        if (!res.ok) throw new Error('Failed to fetch data');

        const data = await res.json();
        const result = data.chart?.result?.[0];

        if (!result) throw new Error('No data found');

        const meta = result.meta || {};
        const price = meta.regularMarketPrice || 0;
        const prev = meta.previousClose || 1;

        const quote = {
            symbol: meta.symbol,
            price: price,
            changePct: prev ? ((price - prev) / prev) * 100 : 0,
            high: meta.regularMarketDayHigh || 0,
            low: meta.regularMarketDayLow || 0,
            open: meta.regularMarketOpen || 0,
            prevClose: prev,
            volume: meta.regularMarketVolume || 0,
            currency: meta.currency
        };

        return NextResponse.json(quote);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
