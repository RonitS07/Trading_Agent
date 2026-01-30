'use client';

import { createContext, useContext } from 'react';
import { SessionProvider } from 'next-auth/react';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { PriceProvider } from './PriceContext';

const PortfolioContext = createContext(null);

export function usePortfolioContext() {
    return useContext(PortfolioContext);
}

function InnerPortfolioProvider({ children, user }) {
    // This hook relies on PriceContext, so it must be a child of PriceProvider
    const portfolioData = usePortfolioData(user);

    return (
        <PortfolioContext.Provider value={portfolioData}>
            {children}
        </PortfolioContext.Provider>
    );
}

export function PortfolioProvider({ children, user }) {
    return (
        <PriceProvider>
            <InnerPortfolioProvider user={user}>
                {children}
            </InnerPortfolioProvider>
        </PriceProvider>
    );
}

export default function Providers({ children }) {
    return (
        <SessionProvider>
            {children}
        </SessionProvider>
    );
}
