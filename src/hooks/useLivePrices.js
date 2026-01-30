import { useEffect, useMemo } from 'react';
import { usePriceContext } from '@/components/PriceContext';

export function useLivePrices(symbols) {
    const { prices, subscribe, unsubscribe } = usePriceContext();

    // Convert input to stable array
    const symbolList = useMemo(() => {
        if (!symbols) return [];
        return Array.isArray(symbols) ? symbols : [symbols];
    }, [JSON.stringify(symbols)]);

    useEffect(() => {
        if (symbolList.length > 0) {
            subscribe(symbolList);
            // unsubscribe is optional/noop for now based on our context logic, 
            // but robust implementation would call it:
            // return () => unsubscribe(symbolList);
        }
    }, [symbolList]); // subscribe is stable

    // Filter prices to return only requested
    const result = {};
    symbolList.forEach(s => {
        if (prices[s]) result[s] = prices[s];
    });

    return result;
}
