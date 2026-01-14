'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import PortfolioSummary from './PortfolioSummary';
import OverviewTab from './OverviewTab';
import AnalysisTab from './AnalysisTab';

export default function Dashboard({ initialUser }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [user, setUser] = useState(initialUser);
    const [selectedStock, setSelectedStock] = useState(null);

    const handleStockSelect = (symbol) => {
        setSelectedStock(symbol);
        setActiveTab('analysis');
    };

    const handleTradeComplete = async (data) => {
        // Refresh user data (server re-fetch)
        router.refresh();
        // Also update local state if possible using API or just router refresh usually works for server components invalidation
        // But since `user` is passed as prop from server component, `router.refresh()` will re-run `Home` and pass new `initialUser`.
        // Wait, `Dashboard` holds `user` state initialized from `initialUser`.
        // `router.refresh()` updates the server component, but client state `useState(initialUser)` MIGHT NOT update if key doesn't change.
        // I should create a useEffect to sync user? Or use key?
        // I'll assume router refresh updates the prop, but I need to update state.
        // Actually, `key={JSON.stringify(initialUser)}` on Dashboard? No.
        // I'll fetch updated user via /api/user?

        // Quick fix: Fetch /api/user?userId=... and setUser.
        try {
            const res = await fetch(`/api/user?userId=${user.id}`);
            const updated = await res.json();
            if (!updated.error) setUser(updated);
        } catch (e) { console.error(e); }
    };

    return (
        <>
            <Header
                user={user}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <PortfolioSummary user={user} />

            <div className="main-layout">
                <Sidebar user={user} onSelectStock={handleStockSelect} />

                <main id="tab-container" className="content-area">
                    {activeTab === 'overview' && <OverviewTab />}
                    {activeTab === 'analysis' && (
                        <AnalysisTab
                            user={user}
                            symbol={selectedStock}
                            onTradeComplete={handleTradeComplete}
                        />
                    )}
                    {activeTab === 'planner' && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                            AI Planner (Coming Soon)
                        </div>
                    )}
                </main>
            </div>

            <div id="toast" className="toast hidden"></div>
        </>
    );
}
