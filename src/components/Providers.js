'use client';

import { createContext, useContext } from 'react';
import { SessionProvider } from 'next-auth/react';
import { usePortfolioData } from '@/hooks/usePortfolioData';

const PortfolioContext = createContext(null);

export function usePortfolioContext() {
    return useContext(PortfolioContext);
}

export function PortfolioProvider({ children, user }) {
    // Joint state for the entire app, initialized with the full user object
    const portfolioData = usePortfolioData(user);

    return (
        <PortfolioContext.Provider value={portfolioData}>
            {children}
        </PortfolioContext.Provider>
    );
}

export default function Providers({ children }) {
    return (
        <SessionProvider>
            {children}
        </SessionProvider>
    );
}
