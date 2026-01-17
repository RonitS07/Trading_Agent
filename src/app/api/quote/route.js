import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbol');

    if (!symbolsParam) {
        return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    const symbols = symbolsParam.split(',').map(s => s.trim());

    try {
        const fetchQuote = async (symbol) => {
            const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                cache: 'no-store'
            });

            if (!res.ok) return null;

            const data = await res.json();
            const result = data.chart?.result?.[0];
            if (!result) return null;

            const meta = result.meta || {};
            const indicators = result.indicators?.quote?.[0] || {};
            const prices = indicators.close || [];
            const highs = indicators.high || [];
            const lows = indicators.low || [];
            const opens = indicators.open || [];

            const validPrices = prices.filter(p => p !== null);
            const validHighs = highs.filter(h => h !== null);
            const validLows = lows.filter(l => l !== null);
            const validOpens = opens.filter(o => o !== null);

            const price = meta.regularMarketPrice || validPrices[validPrices.length - 1] || 0;
            const prev = meta.previousClose || 1;

            // Robust stats: fallback to chart extremes if meta is missing
            const high = meta.regularMarketDayHigh || (validHighs.length > 0 ? Math.max(...validHighs) : (price || 0));
            const low = meta.regularMarketDayLow || (validLows.length > 0 ? Math.min(...validLows) : (price || 0));
            const open = meta.regularMarketOpen || (validOpens.length > 0 ? validOpens[0] : (price || 0));

            return {
                symbol: meta.symbol,
                price: price,
                changePct: prev ? ((price - prev) / prev) * 100 : 0,
                high: high,
                low: low,
                open: open,
                prevClose: prev,
                volume: meta.regularMarketVolume || 0,
                currency: meta.currency
            };
        };

        if (symbols.length === 1) {
            const quote = await fetchQuote(symbols[0]);
            if (!quote) throw new Error('No data found');
            return NextResponse.json(quote);
        } else {
            const quotes = await Promise.all(symbols.map(s => fetchQuote(s)));
            return NextResponse.json(quotes.filter(q => q !== null));
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
