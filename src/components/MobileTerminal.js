'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import AIChat from './AIChat';
import MobileOnboarding from './MobileOnboarding';
import { ChartSkeleton } from './LoadingSkeleton';

import { usePortfolioContext } from '@/components/Providers';
import { useLivePrices } from '@/hooks/useLivePrices';
import { useToast } from './Toast';

// Dynamic imports for code splitting and lazy loading
const HomeTab = dynamic(() => import('./tabs/HomeTab'), {
    loading: () => <div style={{ padding: '20px' }}><ChartSkeleton /></div>
});
const AnalysisTab = dynamic(() => import('./tabs/AnalysisTab'), {
    loading: () => <div style={{ padding: '20px' }}><ChartSkeleton /></div>
});
const AssetsTab = dynamic(() => import('./tabs/AssetsTab'), {
    loading: () => <div style={{ padding: '20px' }}><ChartSkeleton /></div>
});

export default function MobileTerminal({ user, onTradeComplete, onProfile, onLogout }) {
    const {
        watchlist,
        toggleWatchlist,
        quotes: prices,
        refresh,
        netWorth,
        invested,
        unrealizedPL,
        balance,
        marketStatus,
        isLoading: portfolioLoading
    } = usePortfolioContext();

    const [activeView, setActiveView] = useState('home');
    const [selectedStock, setSelectedStock] = useState('AAPL');
    const [stockData, setStockData] = useState(null);
    const [range, setRange] = useState('1d'); // Changed default to '1d' to match original

    const ranges = [
        { label: '1D', value: '1d' },
        { label: '1M', value: '1mo' },
        { label: '6M', value: '6mo' },
        { label: '5Y', value: '5y' },
    ];

    // Alias for compatibility
    const watchlistQuotes = prices;

    // Open Orders State (Mobile Sync)
    const [openOrders, setOpenOrders] = useState([]);
    const prevOrderCount = useRef(0);

    useEffect(() => {
        if (!user) return;
        const fetchOrders = async () => {
            try {
                const res = await fetch('/api/orders');
                if (res.ok) {
                    const data = await res.json();
                    if (data.length !== prevOrderCount.current) {
                        refresh();
                        prevOrderCount.current = data.length;
                    }
                    setOpenOrders(data);
                }
            } catch (e) { /* silent */ }
        };
        fetchOrders();
        const interval = setInterval(fetchOrders, 3000);
        return () => clearInterval(interval);
    }, [user, refresh]);

    // Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Onboarding State
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Initial Load & Onboarding Check
    useEffect(() => {
        if (!user) {
            const hasOnboarded = localStorage.getItem('tp_onboarding_completed_guest');
            if (!hasOnboarded) setShowOnboarding(true);
            return;
        }

        // DUAL GUARD
        if (!user.onboarded) {
            const hasOnboarded = localStorage.getItem(`tp_onboarding_completed_${user.id}`);
            if (!hasOnboarded) setShowOnboarding(true);
        }
    }, [user]);

    const handleOnboardingComplete = async () => {
        setShowOnboarding(false);
        if (user) {
            try {
                await fetch('/api/user', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, onboarded: true })
                });
            } catch (e) { /* silent */ }
            localStorage.setItem(`tp_onboarding_completed_${user.id}`, 'true');
        } else {
            localStorage.setItem('tp_onboarding_completed_guest', 'true');
        }
    };

    // Search Debounce Logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                try {
                    const res = await fetch(`/api/search?q=${searchQuery}`);
                    const data = await res.json();
                    setSearchResults(data);
                } catch (e) { /* silent */ }
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // Sync selected stock data from the hook
    useEffect(() => {
        if (prices[selectedStock]) {
            setStockData(prices[selectedStock]);
        }
    }, [prices, selectedStock]);

    const totalPnL = netWorth - 100000;

    const handleSelectStock = (symbol) => {
        setSelectedStock(symbol);
        setActiveView('analysis');
        setIsSearchOpen(false);
        setSearchQuery('');
    };

    const showToast = useToast();

    // The toggleWatchlist function is now provided by usePortfolioContext,
    // so the local implementation is removed.
    // The call site in the JSX will use the context version.

    return (
        <div className="mobile-app-theme" style={{ color: 'white', minHeight: '100dvh', paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))', position: 'relative', fontFamily: 'Inter, sans-serif' }}>

            {showOnboarding && <MobileOnboarding onComplete={handleOnboardingComplete} />}

            {/* Header */}
            <header className="m-top-bar" style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, zIndex: 50 }}>
                <div
                    className="m-profile-pill"
                    onClick={onProfile}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                >
                    <div className="m-avatar" style={{ background: 'linear-gradient(135deg, var(--accent-blue), #3b82f6)', width: '38px', height: '38px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '1rem', fontWeight: 'bold' }}>
                        {user?.name?.[0] || 'U'}
                    </div>
                    <div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.6, letterSpacing: '0.5px' }}>WALLET</div>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>₹{balance.toLocaleString('en-IN')}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="m-market-chip" style={{ background: marketStatus.open ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${marketStatus.open ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className="m-dot" style={{ width: '6px', height: '6px', background: marketStatus.open ? 'var(--neon-green)' : 'var(--neon-red)', borderRadius: '50%', boxShadow: `0 0 8px ${marketStatus.open ? 'var(--neon-green)' : 'var(--neon-red)'}` }}></div>
                        <span className="m-status-text" style={{ fontSize: '0.65rem', fontWeight: '800', color: marketStatus.open ? 'var(--neon-green)' : 'var(--neon-red)' }}>{marketStatus.open ? 'OPEN' : 'CLOSED'}</span>
                    </div>
                    <div
                        onClick={() => setIsSearchOpen(true)}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--accent-cyan)' }}></i>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main>
                {activeView === 'home' && (
                    <HomeTab
                        user={user}
                        netWorth={netWorth}
                        invested={invested}
                        balance={balance}
                        totalPnL={totalPnL}
                        watchlist={watchlist}
                        watchlistQuotes={watchlistQuotes}
                        handleSelectStock={handleSelectStock}
                        toggleWatchlist={toggleWatchlist}
                    />
                )}

                {activeView === 'analysis' && (
                    <AnalysisTab
                        selectedStock={selectedStock}
                        stockData={stockData}
                        range={range}
                        setRange={setRange}
                        ranges={ranges}
                        user={user}
                        onTradeComplete={onTradeComplete}
                        marketStatus={marketStatus}
                        watchlist={watchlist}
                        toggleWatchlist={toggleWatchlist}
                    />
                )}

                {activeView === 'ai' && (
                    <section id="m-view-ai">
                        <AIChat selectedStockData={stockData} user={user} />
                    </section>
                )}

                {activeView === 'assets' && (
                    <AssetsTab
                        user={user}
                        prices={prices}
                        openOrders={openOrders}
                        handleSelectStock={handleSelectStock}
                        setActiveView={setActiveView}
                    />
                )}
            </main>

            {/* Bottom Blur Mask */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: 'calc(80px + env(safe-area-inset-bottom, 0px))',
                background: 'linear-gradient(to top, #020617 30%, rgba(2,6,23, 0.8) 70%, rgba(2,6,23, 0) 100%)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                pointerEvents: 'none',
                zIndex: 90
            }} />

            {/* Floating Glowing Bottom Nav with Safe Area Support */}
            <nav style={{
                position: 'fixed',
                bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
                left: '20px',
                right: '20px',
                background: 'rgba(5, 10, 20, 0.99)',
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                display: 'flex',
                justifyContent: 'space-around',
                padding: '10px 6px',
                borderRadius: '24px',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                boxShadow: '0 0 40px rgba(6, 182, 212, 0.12), 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                zIndex: 100
            }}>
                {[
                    { id: 'home', icon: 'fa-house', label: 'Home' },
                    { id: 'analysis', icon: 'fa-chart-line', label: 'Trade' },
                    { id: 'ai', icon: 'fa-robot', label: 'AI' },
                    { id: 'assets', icon: 'fa-briefcase', label: 'Wallet' }
                ].map(tab => {
                    const isActive = activeView === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id)}
                            style={{
                                background: isActive ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(6, 182, 212, 0.15))' : 'transparent',
                                border: 'none',
                                color: isActive ? '#06d6d6' : 'rgba(148, 163, 184, 0.6)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '8px 16px',
                                borderRadius: '16px',
                                transition: 'all 0.25s ease',
                                boxShadow: isActive ? '0 0 20px rgba(6, 182, 212, 0.35), inset 0 0 12px rgba(6, 182, 212, 0.1)' : 'none',
                                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                opacity: isActive ? 1 : 0.7
                            }}
                        >
                            <i className={`fa-solid ${tab.icon}`} style={{
                                fontSize: '1.15rem',
                                textShadow: isActive ? '0 0 12px rgba(6, 182, 212, 0.8)' : 'none'
                            }}></i>
                            <span style={{ fontSize: '0.6rem', fontWeight: isActive ? '800' : '600', letterSpacing: '0.3px' }}>{tab.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* SEARCH OVERLAY */}
            {isSearchOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#020617', zIndex: 200, padding: '20px', animation: 'fadeIn 0.2s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                        <i className="fa-solid fa-arrow-left" onClick={() => setIsSearchOpen(false)} style={{ fontSize: '1.2rem', padding: '10px' }}></i>
                        <input
                            type="text"
                            autoFocus
                            placeholder="Search stocks..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', padding: '14px', borderRadius: '12px', color: 'white', outline: 'none', fontSize: '1rem' }}
                        />
                    </div>
                    <div>
                        {searchResults.length === 0 && searchQuery.length >= 2 && (
                            <div style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.5 }}>
                                <i className="fa-solid fa-search" style={{ fontSize: '2rem', marginBottom: '10px', display: 'block' }}></i>
                                No results found for "{searchQuery}"
                            </div>
                        )}
                        {searchResults.map(item => (
                            <div key={item.symbol} onClick={() => handleSelectStock(item.symbol)} style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{item.symbol}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{item.shortname}</div>
                                </div>
                                <i
                                    className={`fa-${watchlist.includes(item.symbol) ? 'solid' : 'regular'} fa-star`}
                                    style={{ color: 'var(--accent-cyan)', padding: '10px', fontSize: '1.1rem' }}
                                    onClick={(e) => toggleWatchlist(e, item.symbol)}
                                ></i>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
