import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json([]);
    }

    try {
        const res = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 3600 } // Cache search results for 1 hour
        });

        const data = await res.json();
        const quotes = data.quotes || [];

        const filtered = quotes
            .filter(q =>
                (q.exchange === 'NSI' || q.exchange === 'BSE' || q.exchange === 'NSE') ||
                (q.symbol && (q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO')))
            )
            .map(q => ({
                symbol: q.symbol,
                shortname: q.shortname || q.longname || q.symbol,
                exchange: q.exchange
            }));

        return NextResponse.json(filtered);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
