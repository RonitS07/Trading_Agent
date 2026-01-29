import { NextResponse } from 'next/server';

// In-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 60000; // 60 seconds
const pendingRequests = new Map(); // Request deduplication

function getCached(symbol) {
    const cached = cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    return null;
}

function setCache(symbol, data) {
    cache.set(symbol, {
        data,
        timestamp: Date.now()
    });
}

async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                cache: 'no-store',
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            if (res.ok) return res;

            // Don't retry on 4xx errors
            if (res.status >= 400 && res.status < 500) {
                throw new Error(`Client error: ${res.status}`);
            }
        } catch (e) {
            if (i === retries - 1) throw e;
            // Exponential backoff: 1s, 2s, 4s
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
        }
    }
    throw new Error('Max retries reached');
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbol');

    if (!symbolsParam) {
        return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    const symbols = symbolsParam.split(',').map(s => s.trim());

    try {
        const fetchQuote = async (symbol) => {
            // Check cache first
            const cached = getCached(symbol);
            if (cached) {
                return cached;
            }

            // Check if there's already a pending request for this symbol
            if (pendingRequests.has(symbol)) {
                return await pendingRequests.get(symbol);
            }

            // Create new request
            const requestPromise = (async () => {
                try {
                    const res = await fetchWithRetry(
                        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`
                    );

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

                    const quoteData = {
                        symbol: meta.symbol || symbol,
                        price: price,
                        changePct: prev ? ((price - prev) / prev) * 100 : 0,
                        high: high,
                        low: low,
                        open: open,
                        prevClose: prev,
                        volume: meta.regularMarketVolume || 0,
                        currency: meta.currency || 'INR'
                    };

                    // Cache the result
                    setCache(symbol, quoteData);
                    return quoteData;
                } finally {
                    // Remove from pending requests
                    pendingRequests.delete(symbol);
                }
            })();

            // Store the promise
            pendingRequests.set(symbol, requestPromise);
            return await requestPromise;
        };

        if (symbols.length === 1) {
            const quote = await fetchQuote(symbols[0]);
            if (!quote) {
                // Return graceful error instead of 500
                return NextResponse.json({
                    error: 'No data found',
                    symbol: symbols[0],
                    price: 0,
                    changePct: 0
                }, { status: 200 }); // Return 200 to prevent error cascade
            }
            return NextResponse.json(quote);
        } else {
            const quotes = await Promise.all(symbols.map(s => fetchQuote(s)));
            return NextResponse.json(quotes.filter(q => q !== null));
        }
    } catch (error) {
        console.error('Quote API Error:', error);
        // Return graceful error response instead of 500
        return NextResponse.json({
            error: 'Unable to fetch quote data',
            message: error.message,
            symbols: symbols,
            price: 0,
            changePct: 0
        }, { status: 200 });
    }
}
