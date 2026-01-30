import { useState, useEffect, useMemo, useCallback } from 'react';
import { isMarketOpen } from '@/lib/market';
import { useLivePrices } from './useLivePrices';
import { useToast } from '@/components/Toast';

export function usePortfolioData(user) {
    const showToast = useToast();
    const [marketStatus, setMarketStatus] = useState(isMarketOpen());
    const [userState, setUserState] = useState(user);
    const [watchlist, setWatchlist] = useState([]);
    const holdings = userState?.portfolio || [];
    const balance = userState?.balance || 0;

    // Sync state with props when user data changes (e.g. after a trade)
    useEffect(() => {
        if (user) {
            setUserState(user);
        }
    }, [user]);

    const refresh = async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`/api/user?userId=${user.id}`);
            const data = await res.json();
            if (!data.error) {
                setUserState(data);
            }
        } catch (e) { /* silent */ }
    };

    // Watchlist Initialization & Sync
    useEffect(() => {
        const saved = localStorage.getItem('tp_watchlist');
        if (saved) setWatchlist(JSON.parse(saved));

        if (user) {
            const fetchWatchlist = async () => {
                try {
                    const res = await fetch('/api/watchlist');
                    if (res.ok) {
                        const data = await res.json();
                        if (Array.isArray(data)) {
                            setWatchlist(data);
                            localStorage.setItem('tp_watchlist', JSON.stringify(data));
                        }
                    }
                } catch (e) { /* silent */ }
            };
            fetchWatchlist();
        }
    }, [user]);

    const toggleWatchlist = useCallback(async (e, symbol) => {
        if (e) e.stopPropagation();

        setWatchlist(prev => {
            const isInList = prev.includes(symbol);
            const newList = isInList ? prev.filter(s => s !== symbol) : [...prev, symbol];

            localStorage.setItem('tp_watchlist', JSON.stringify(newList));

            // Background Sync
            if (user) {
                fetch('/api/watchlist', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ symbol, action: isInList ? 'REMOVE' : 'ADD' })
                }).catch(() => { });
            }

            // We'll show the toast in a microtask or just let the caller handle it if needed
            // But for centralization, let's use a timeout if we really want it here
            setTimeout(() => {
                showToast(`${symbol} ${isInList ? 'removed from' : 'added to'} watchlist`, 'success');
            }, 0);

            return newList;
        });
    }, [user, showToast]);

    // Get symbols for pricing (Holdings + Watchlist)
    const pricingSymbols = useMemo(() => {
        const holdingSymbols = holdings.map(h => h.symbol);
        return [...new Set([...watchlist, ...holdingSymbols])];
    }, [watchlist, holdings]);

    // Use centralized prices
    const quotes = useLivePrices(pricingSymbols);

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
        watchlist,
        toggleWatchlist,
        marketStatus,
        isLoading: false, // For compatibility with components expecting this prop
        ...calculateTotals(),
        refresh
    };
}
