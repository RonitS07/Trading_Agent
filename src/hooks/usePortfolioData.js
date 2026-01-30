import { useState, useEffect, useMemo } from 'react';
import { isMarketOpen } from '@/lib/market';
import { useLivePrices } from './useLivePrices';

export function usePortfolioData(user) {
    const [marketStatus, setMarketStatus] = useState(isMarketOpen());
    const holdings = user?.portfolio || [];
    const balance = user?.balance || 0;

    // Get symbols from holdings
    const symbols = useMemo(() => holdings.map(h => h.symbol), [holdings]);

    // Use centralized prices
    const quotes = useLivePrices(symbols);

    // Update market status periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setMarketStatus(isMarketOpen());
        }, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, []);

    // Derived Math
    const calculateTotals = () => {
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

        const totalPL = unrealizedPL;
        const totalPLPct = unrealizedPLPct;

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
        // refresh is now a no-op or leads to context refresh, 
        // but for now context auto-refreshes so we don't strictly need it.
        refresh: () => { }
    };
}
