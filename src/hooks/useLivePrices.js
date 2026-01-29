import { useState, useEffect, useRef } from 'react';

export function useLivePrices(symbols) {
    const [prices, setPrices] = useState({});
    const symbolsRef = useRef(symbols);

    // Keep ref updated to avoid effect re-triggering just on array reference change
    useEffect(() => {
        symbolsRef.current = symbols;
    }, [symbols]);

    useEffect(() => {
        let isMounted = true;

        const fetchPrices = async () => {
            const currentSymbols = symbolsRef.current;
            if (!currentSymbols || currentSymbols.length === 0) return;

            try {
                const uniqueSymbols = [...new Set(currentSymbols)];
                const query = uniqueSymbols.join(',');
                const res = await fetch(`/api/quote?symbol=${query}`);
                const data = await res.json();

                if (!isMounted) return;

                const newPrices = {};
                if (Array.isArray(data)) {
                    data.forEach(q => newPrices[q.symbol] = q);
                } else if (data && data.symbol) {
                    newPrices[data.symbol] = data;
                }

                // Merge with existing to preserve any data not returned in this specific partial fetch (if any)
                setPrices(prev => ({ ...prev, ...newPrices }));
            } catch (e) {
                console.error("Error fetching prices:", e);
            }
        };

        const simulateLive = () => {
            setPrices(prev => {
                const next = { ...prev };
                let hasChanges = false;

                Object.keys(next).forEach(symbol => {
                    const q = next[symbol];
                    if (!q) return;

                    // Simulate small random ticks
                    const change = q.price * 0.0005 * (Math.random() - 0.5);
                    const newPrice = q.price + change;

                    // Don't update High/Low during simulation - only API should set these
                    // This prevents infinite drift of these values
                    next[symbol] = {
                        ...q,
                        price: newPrice,
                        changePct: ((newPrice - q.prevClose) / q.prevClose) * 100
                    };
                    hasChanges = true;
                });

                return hasChanges ? next : prev;
            });
        };

        // Initial fetch
        fetchPrices();

        // Intervals
        const fetchInterval = setInterval(fetchPrices, 30000); // Poll API every 30s
        const simInterval = setInterval(simulateLive, 1000);   // Simulate ticks every 1s

        return () => {
            isMounted = false;
            clearInterval(fetchInterval);
            clearInterval(simInterval);
        };
    }, [JSON.stringify(symbols)]); // Use stringified symbols to detect actual content changes

    return prices;
}
