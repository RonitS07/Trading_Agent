'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import PortfolioSummary from './PortfolioSummary';
import OverviewTab from './OverviewTab';
import AnalysisTab from './AnalysisTab';
import AIChat from './AIChat';
import { isMarketOpen } from '@/lib/market';

export default function DesktopTerminal({ user, onTradeComplete }) {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
    // Sync URL with active tab (optional, but good for persistence)
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (params.get('tab') !== activeTab) {
            // we could update URL here but lets just handle incoming for now to avoid hydration mismatches
        }
    }, [activeTab, searchParams]);
    const [selectedStock, setSelectedStock] = useState('AAPL');
    const [selectedStockData, setSelectedStockData] = useState(null);
    const [marketStatus, setMarketStatus] = useState(isMarketOpen());

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
    // Initialize default stock data
    useEffect(() => {
        if (!selectedStockData && selectedStock) {
            handleStockSelect(selectedStock, false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if input is focused
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

            if (e.key.toLowerCase() === 'b') {
                setActiveTab('analysis'); // Force switch to trade view
                // We need a way to trigger the Buy Modal. 
                // For MVP without complex Context, we'll use a custom event or rely on the user seeing the tab switch
                // and clicking. BUT, user asked for it to work.
                // Let's dispatch a custom event that TradePanel listens to.
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

    return (
        <div className="app-container">
            <Header
                user={user}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                marketStatus={marketStatus}
            />

            <PortfolioSummary user={user} />

            <div className="main-layout">
                <Sidebar user={user} onSelectStock={handleStockSelect} />

                <main id="tab-container" className="content-area">
                    {activeTab === 'overview' && <OverviewTab user={user} onSelectStock={handleStockSelect} />}
                    {activeTab === 'analysis' && (
                        <AnalysisTab
                            user={user}
                            symbol={selectedStock}
                            stockData={selectedStockData}
                            onTradeComplete={onTradeComplete}
                            marketStatus={marketStatus}
                        />
                    )}
                    {activeTab === 'planner' && (
                        <AIChat selectedStockData={selectedStockData} user={user} />
                    )}
                </main>
            </div>
        </div>
    );
}
