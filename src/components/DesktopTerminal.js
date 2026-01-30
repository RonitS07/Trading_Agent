'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import PortfolioSummary from './PortfolioSummary';
import OverviewTab from './OverviewTab';
import AnalysisTab from './tabs/AnalysisTab';
import AIChat from './AIChat';
import OnboardingTour from './OnboardingTour';
import { isMarketOpen } from '@/lib/market';
import { usePortfolioContext } from './Providers';

export default function DesktopTerminal({ user, onTradeComplete }) {
    const { watchlist, toggleWatchlist, marketStatus } = usePortfolioContext();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

    // ... rest of the component state ...
    const [selectedStock, setSelectedStock] = useState('AAPL');
    const [selectedStockData, setSelectedStockData] = useState(null);
    const [range, setRange] = useState('1d');

    const ranges = [
        { label: '1D', value: '1d' },
        { label: '1M', value: '1mo' },
        { label: '6M', value: '6mo' },
        { label: '5Y', value: '5y' },
    ];

    const handleStockSelect = async (symbol, shouldSwitchTab = true) => {
        setSelectedStock(symbol);
        if (shouldSwitchTab) setActiveTab('analysis');
        try {
            const res = await fetch(`/api/quote?symbol=${symbol}`);
            const data = await res.json();
            setSelectedStockData(data);
        } catch (e) {
            // silent
        }
    }

    // Keyboard Shortcuts effect
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
            if (e.key.toLowerCase() === 'b') {
                setActiveTab('analysis');
                window.dispatchEvent(new CustomEvent('trade-shortcut', { detail: 'BUY' }));
            }
            if (e.key.toLowerCase() === 's') {
                setActiveTab('analysis');
                window.dispatchEvent(new CustomEvent('trade-shortcut', { detail: 'SELL' }));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="app-container">
            <Header
                user={user}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                marketStatus={marketStatus}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <PortfolioSummary user={user} />

            <div className="main-layout">
                <Sidebar
                    user={user}
                    onSelectStock={handleStockSelect}
                    isOpen={isSidebarOpen}
                    closeSidebar={() => setIsSidebarOpen(false)}
                />

                <main id="tab-container" className="content-area">
                    {activeTab === 'overview' && <OverviewTab user={user} onSelectStock={handleStockSelect} />}
                    {activeTab === 'analysis' && (
                        <AnalysisTab
                            user={user}
                            selectedStock={selectedStock}
                            stockData={selectedStockData}
                            range={range}
                            setRange={setRange}
                            ranges={ranges}
                            onTradeComplete={onTradeComplete}
                            marketStatus={marketStatus}
                            watchlist={watchlist}
                            toggleWatchlist={toggleWatchlist}
                        />
                    )}
                    {activeTab === 'planner' && (
                        <AIChat selectedStockData={selectedStockData} user={user} />
                    )}
                </main>
            </div>
            <OnboardingTour user={user} />
        </div>
    );
}
