'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { isMarketOpen } from '@/lib/market';

const PriceContext = createContext(null);

export function usePriceContext() {
    return useContext(PriceContext);
}

export function PriceProvider({ children }) {
    const [prices, setPrices] = useState({});
    const [subscriptions, setSubscriptions] = useState(new Set());
    const [marketStatus, setMarketStatus] = useState({ open: false, reason: '' });

    // We use a ref for subscriptions to access them immediately inside the interval
    // without needing to reset the interval on every subscription change
    const subsRef = useRef(new Set());

    const subscribe = (newSymbols) => {
        if (!newSymbols || newSymbols.length === 0) return;

        setSubscriptions(prev => {
            const next = new Set(prev);
            let changed = false;
            newSymbols.forEach(s => {
                if (!next.has(s)) {
                    next.add(s);
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    };

    const unsubscribe = (removeSymbols) => {
        // For a simple app, we might not aggressively unsubscribe to keep cache warm,
        // but let's implement for correctness.
        // NOTE: In a real complex app, we'd count reference to know if *anyone* still needs it.
        // Here, we'll keep it simple: we generally don't unsubscribe until full unmount or simple logic.
        // Actually, for this specific request "optimize flow", let's be smart. 
        // We will just keep the set additive for the session to ensure instant data if user switches back tabs.
        // Only a hard refresh clears it. This is better UX for a trading terminal than frequent loading states.
    };

    // Sync ref
    useEffect(() => {
        subsRef.current = subscriptions;
    }, [subscriptions]);

    // The Master Polling Loop (Market Aware)
    useEffect(() => {
        let intervalId = null;

        const fetchPrices = async () => {
            // Check market status each time
            const status = isMarketOpen();
            setMarketStatus(status);

            const currentSubs = Array.from(subsRef.current);
            if (currentSubs.length === 0) return;

            try {
                // Batch request
                const query = currentSubs.join(',');
                const res = await fetch(`/api/quote?symbol=${query}`);
                const data = await res.json();

                const newPrices = {};
                if (Array.isArray(data)) {
                    data.forEach(q => newPrices[q.symbol] = q);
                } else if (data && data.symbol) {
                    newPrices[data.symbol] = data;
                }

                // Update state
                setPrices(prev => ({ ...prev, ...newPrices }));
            } catch (e) {
                // silent
            }
        };

        const startPolling = () => {
            // Clear any existing interval
            if (intervalId) clearInterval(intervalId);

            // Fetch immediately
            fetchPrices();

            // Determine interval based on market status
            const status = isMarketOpen();
            // 500ms when open for real-time feel, 5 min when closed (just to get closing price)
            const pollInterval = status.open ? 500 : 300000;

            intervalId = setInterval(fetchPrices, pollInterval);
        };

        startPolling();

        // Re-check market status every minute to adjust polling dynamically
        const statusCheckInterval = setInterval(() => {
            const newStatus = isMarketOpen();
            setMarketStatus(prev => {
                // Only restart polling if open status actually changed
                if (prev.open !== newStatus.open) {
                    startPolling();
                }
                return newStatus;
            });
        }, 60000);

        return () => {
            if (intervalId) clearInterval(intervalId);
            clearInterval(statusCheckInterval);
        };
    }, []);

    return (
        <PriceContext.Provider value={{ prices, subscribe, unsubscribe, marketStatus }}>
            {children}
        </PriceContext.Provider>
    );
}

