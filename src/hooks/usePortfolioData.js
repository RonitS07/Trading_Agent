import { useState, useEffect, useCallback, useRef } from 'react';
import { isMarketOpen } from '@/lib/market';

export function usePortfolioData(user) {
    const [quotes, setQuotes] = useState({});
    const [marketStatus, setMarketStatus] = useState(isMarketOpen());
    const holdings = user?.portfolio || [];
    const balance = user?.balance || 0;

    // Update market status periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setMarketStatus(isMarketOpen());
        }, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, []);

    // 1. Fetch Real Data (Anchor)
    const fetchRealData = useCallback(async () => {
        if (holdings.length === 0) return;
        try {
            const symbols = holdings.map(h => h.symbol).join(',');
            // Also fetch NIFTY for general sentiment if needed, but keep it simple here
            const res = await fetch(`/api/quote?symbol=${symbols}`);
            const data = await res.json();

            const quoteMap = {};
            if (Array.isArray(data)) {
                data.forEach(q => quoteMap[q.symbol] = q);
            } else if (data && data.symbol) {
                quoteMap[data.symbol] = data;
            }

            // Update quotes, merged with previous to prevent flicker
            setQuotes(prev => ({ ...prev, ...quoteMap }));
        } catch (e) {
            // Silent fail
        }
    }, [holdings]);

    // 2. Rapid Simulation Logic
    useEffect(() => {
        if (holdings.length === 0) return;

        // Initial Anchor
        fetchRealData();
        const anchorInterval = setInterval(fetchRealData, 30000);

        // Micro-movements (800ms)
        const simInterval = setInterval(() => {
            setQuotes(prev => {
                const next = { ...prev };
                let hasChanges = false;

                for (const sym in next) {
                    const q = next[sym];
                    if (!q) continue;

                    // Micro-volatility: +/- 0.1% max
                    const volatility = 0.001;
                    const change = q.price * volatility * (Math.random() - 0.5);
                    const newPrice = q.price + change;

                    next[sym] = {
                        ...q,
                        price: newPrice,
                        changePct: ((newPrice - q.prevClose) / q.prevClose) * 100
                    };
                    hasChanges = true;
                }
                return hasChanges ? next : prev;
            });
        }, 800);

        return () => {
            clearInterval(anchorInterval);
            clearInterval(simInterval);
        };
    }, [fetchRealData, holdings.length]);

    // 3. Derived Math
    const calculateTotals = () => {
        const initialCapital = 100000;
        let invested = 0;
        let valuation = 0;

        holdings.forEach(h => {
            invested += h.qty * h.avgCost;
            const price = quotes[h.symbol]?.price || h.avgCost; // Fallback to cost if no quote
            valuation += h.qty * price;
        });

        const unrealizedPL = valuation - invested;
        const unrealizedPLPct = invested > 0 ? (unrealizedPL / invested) * 100 : 0;
        const netWorth = balance + valuation;

        const totalPL = netWorth - initialCapital;
        const totalPLPct = (totalPL / initialCapital) * 100;

        return {
            invested,
            valuation,
            unrealizedPL,
            unrealizedPLPct,
            netWorth,
            balance,
            totalPL,
            totalPLPct
        };
    };

    return {
        quotes,
        holdings,
        marketStatus,
        ...calculateTotals(),
        refresh: fetchRealData
    };
}
