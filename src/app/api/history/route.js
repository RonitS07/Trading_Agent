import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const range = searchParams.get('range') || '1d';

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    // Map range to interval
    const rangeMap = {
        '1d': '1m',
        '5d': '15m',
        '1mo': '60m', // 1h
        '3mo': '1d',
        '1y': '1d',
        '5y': '1wk',
        'max': '1mo'
    };

    const interval = rangeMap[range] || '1d';

    try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 60 }
        });

        if (!res.ok) throw new Error('Failed to fetch history');

        const data = await res.json();
        const result = data.chart?.result?.[0];

        if (!result) throw new Error('No data found');

        const timestamps = result.timestamp || [];
        const quotes = result.indicators?.quote?.[0] || {};
        const closes = quotes.close || [];

        // Filter nulls and format
        const history = timestamps.map((t, i) => ({
            time: t * 1000, // JS timestamp
            price: closes[i]
        })).filter(d => d.price !== null && d.price !== undefined);

        return NextResponse.json(history);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
