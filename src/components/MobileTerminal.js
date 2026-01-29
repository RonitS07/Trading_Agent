'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AIChat from './AIChat';
import { ChartSkeleton } from './LoadingSkeleton';

import { usePortfolioData } from '@/hooks/usePortfolioData';
import { useLivePrices } from '@/hooks/useLivePrices';

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

export default function MobileTerminal({ user, onProfile, onLogout, onTradeComplete }) {
    const [range, setRange] = useState('1d');
    const [activeView, setActiveView] = useState('home');
    const [selectedStock, setSelectedStock] = useState('RELIANCE.NS');
    const [stockData, setStockData] = useState(null);

    const ranges = [
        { label: '1D', value: '1d' },
        { label: '1W', value: '1w' },
        { label: '1M', value: '1mo' },
        { label: '6M', value: '6mo' },
        { label: '5Y', value: '5y' },
    ];

    const [watchlist, setWatchlist] = useState(['RELIANCE.NS', 'TCS.NS', 'INFY.NS']);

    // Combine watchlist + selected stock for fetching
    const allSymbols = [selectedStock, ...watchlist].filter(Boolean);
    const prices = useLivePrices(allSymbols);
    const watchlistQuotes = prices; // Alias for compatibility with existing render logic

    // Use unified hook for portfolio data
    const {
        netWorth,
        invested,
        unrealizedPL,
        balance,
        marketStatus,
        isLoading: portfolioLoading
    } = usePortfolioData(user);

    // Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Load watchlist from local storage
    useEffect(() => {
        const saved = localStorage.getItem('tp_watchlist');
        if (saved) setWatchlist(JSON.parse(saved));
    }, []);

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

    const toggleWatchlist = (e, symbol) => {
        e.stopPropagation();
        let newWatchlist;
        if (watchlist.includes(symbol)) {
            newWatchlist = watchlist.filter(s => s !== symbol);
        } else {
            newWatchlist = [...watchlist, symbol];
        }
        setWatchlist(newWatchlist);
        localStorage.setItem('tp_watchlist', JSON.stringify(newWatchlist));
    };

    return (
        <div className="mobile-app-theme" style={{ background: '#020617', color: 'white', minHeight: '100vh', paddingBottom: '80px', position: 'relative', fontFamily: 'Inter, sans-serif' }}>
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
                        handleSelectStock={handleSelectStock}
                        setActiveView={setActiveView}
                    />
                )}
            </main>

            {/* Bottom Nav */}
            <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(15px)', display: 'flex', justifyContent: 'space-around', padding: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', zIndex: 100 }}>
                <button onClick={() => setActiveView('home')} style={{ background: 'none', border: 'none', color: activeView === 'home' ? 'var(--accent-cyan)' : '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <i className="fa-solid fa-house" style={{ fontSize: '1.2rem' }}></i>
                    {activeView === 'home' && <span style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>Home</span>}
                </button>
                <button onClick={() => setActiveView('analysis')} style={{ background: 'none', border: 'none', color: activeView === 'analysis' ? 'var(--accent-cyan)' : '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <i className="fa-solid fa-chart-line" style={{ fontSize: '1.2rem' }}></i>
                    {activeView === 'analysis' && <span style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>Analysis</span>}
                </button>
                <button onClick={() => setActiveView('ai')} style={{ background: 'none', border: 'none', color: activeView === 'ai' ? 'var(--accent-cyan)' : '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <i className="fa-solid fa-robot" style={{ fontSize: '1.2rem' }}></i>
                    {activeView === 'ai' && <span style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>AI</span>}
                </button>
                <button onClick={() => setActiveView('assets')} style={{ background: 'none', border: 'none', color: activeView === 'assets' ? 'var(--accent-cyan)' : '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <i className="fa-solid fa-briefcase" style={{ fontSize: '1.2rem' }}></i>
                    {activeView === 'assets' && <span style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>Wallet</span>}
                </button>
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
