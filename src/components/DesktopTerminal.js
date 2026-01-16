'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import PortfolioSummary from './PortfolioSummary';
import OverviewTab from './OverviewTab';
import AnalysisTab from './AnalysisTab';
import AIChat from './AIChat';

export default function DesktopTerminal({ user, onTradeComplete }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedStock, setSelectedStock] = useState('RELIANCE.NS');
    const [selectedStockData, setSelectedStockData] = useState(null);

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
    }, []);

    return (
        <div className="pro-theme">
            <Header
                user={user}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <PortfolioSummary user={user} />

            <div className="main-layout">
                <Sidebar user={user} onSelectStock={handleStockSelect} />

                <main id="tab-container" className="content-area">
                    {activeTab === 'overview' && <OverviewTab user={user} />}
                    {activeTab === 'analysis' && (
                        <AnalysisTab
                            user={user}
                            symbol={selectedStock}
                            stockData={selectedStockData}
                            onTradeComplete={onTradeComplete}
                        />
                    )}
                    {activeTab === 'planner' && (
                        <AIChat selectedStockData={selectedStockData} user={user} />
                    )}
                </main>
            </div>

            <div id="toast" className="toast hidden"></div>
        </div>
    );
}
