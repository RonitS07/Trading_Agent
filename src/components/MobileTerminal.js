'use client';

import { useState, useEffect } from 'react';
import StockChart from './StockChart';
import AIChat from './AIChat';
import TradePanel from './TradePanel';

import { usePortfolioData } from '@/hooks/usePortfolioData';

export default function MobileTerminal({ user, onLogout, onTradeComplete }) {
    const [range, setRange] = useState('1d');
    const [activeView, setActiveView] = useState('home');
    const [selectedStock, setSelectedStock] = useState('RELIANCE.NS');
    const [stockData, setStockData] = useState(null);
    const [loadingData, setLoadingData] = useState(false);

    const ranges = [
        { label: '1D', value: '1d' },
        { label: '1W', value: '1w' },
        { label: '1M', value: '1mo' },
        { label: '6M', value: '6mo' },
        { label: '5Y', value: '5y' },
    ];

    const [watchlist, setWatchlist] = useState(['RELIANCE.NS', 'TCS.NS', 'INFY.NS']);
    const [watchlistQuotes, setWatchlistQuotes] = useState({});

    // Use unified hook for portfolio data
    const {
        netWorth,
        invested,
        unrealizedPL,
        balance,
        marketStatus
    } = usePortfolioData(user);

    // Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Profile State
    const [isProfileOpen, setIsProfileOpen] = useState(false);

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

    // Dedicated Data Fetch for SELECTED STOCK (Fixes missing data issue)
    useEffect(() => {
        const fetchSelectedData = async () => {
            if (!selectedStock) return;
            setLoadingData(true);
            try {
                const res = await fetch(`/api/quote?symbol=${selectedStock}`);
                const data = await res.json();
                if (data && (data.symbol || data.price)) {
                    setStockData(data);
                }
            } catch (e) { console.error("Error fetching selected stock:", e); }
            setLoadingData(false);
        };
        fetchSelectedData();
        // Poll every 10s for selected stock
        const interval = setInterval(fetchSelectedData, 10000);
        return () => clearInterval(interval);
    }, [selectedStock]);


    // Watchlist Fetch Logic
    useEffect(() => {
        const fetchWatchlistData = async () => {
            try {
                if (watchlist.length === 0) return;
                const res = await fetch(`/api/quote?symbol=${watchlist.join(',')}`);
                const data = await res.json();
                const quoteMap = {};
                if (Array.isArray(data)) {
                    data.forEach(q => quoteMap[q.symbol] = q);
                } else if (data && data.symbol) {
                    quoteMap[data.symbol] = data;
                }
                setWatchlistQuotes(prev => ({ ...prev, ...quoteMap }));
            } catch (e) { /* silent */ }
        };

        // Simpler simulation for watchlist to keep it alive
        const simulateLive = () => {
            setWatchlistQuotes(prev => {
                const next = { ...prev };
                let hasChanges = false;
                for (const k in next) {
                    const q = next[k];
                    if (!q) continue;
                    const change = q.price * 0.0005 * (Math.random() - 0.5);
                    const newPrice = q.price + change;

                    // Realistic extremes drift
                    const newHigh = Math.max(q.high || newPrice, newPrice);
                    const newLow = Math.min(q.low || newPrice, newPrice);

                    next[k] = {
                        ...q,
                        price: newPrice,
                        high: newHigh,
                        low: newLow,
                        changePct: ((newPrice - q.prevClose) / q.prevClose) * 100
                    };
                    hasChanges = true;
                }
                return hasChanges ? next : prev;
            });
            // Also sim selected if it matches
            if (stockData) {
                setStockData(prev => {
                    if (!prev) return prev;
                    const change = prev.price * 0.0005 * (Math.random() - 0.5);
                    const newPrice = prev.price + change;
                    const newHigh = Math.max(prev.high || newPrice, newPrice);
                    const newLow = Math.min(prev.low || newPrice, newPrice);

                    return {
                        ...prev,
                        price: newPrice,
                        high: newHigh,
                        low: newLow,
                        changePct: ((newPrice - prev.prevClose) / prev.prevClose) * 100
                    };
                });
            }
        };

        fetchWatchlistData();
        const fetchInterval = setInterval(fetchWatchlistData, 30000);
        const simInterval = setInterval(simulateLive, 1000);

        return () => {
            clearInterval(fetchInterval);
            clearInterval(simInterval);
        };
    }, [watchlist]); // Removed selectedStock dependency to decouple

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
                    onClick={() => setIsProfileOpen(true)}
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
                    <div className="m-content" style={{ padding: '20px' }}>

                        {/* 1. Net Worth Card */}
                        <div style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', borderRadius: '24px', padding: '24px', marginBottom: '25px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--accent-cyan)', opacity: '0.05', filter: 'blur(50px)', borderRadius: '50%' }}></div>
                            <div style={{ opacity: 0.7, fontSize: '0.85rem', marginBottom: '8px', letterSpacing: '0.5px' }}>NET WORTH</div>
                            <div style={{ fontSize: '2.4rem', fontWeight: '800', fontFamily: 'var(--font-mono)', letterSpacing: '-1px' }}>₹{netWorth.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
                                <div>
                                    <div style={{ opacity: 0.6, fontSize: '0.75rem', marginBottom: '4px' }}>TODAY'S P&L</div>
                                    <div style={{ color: totalPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 'bold', fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}>
                                        {totalPnL >= 0 ? '+' : ''}₹{Math.abs(totalPnL).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <button onClick={() => setActiveView('analysis')} style={{ padding: '10px 20px', borderRadius: '14px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(6, 182, 212, 0.3)', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Insights <i className="fa-solid fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>

                        {/* 2. Portfolio Performance Chart */}
                        <div style={{ marginBottom: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Performance</h3>
                                <span style={{ fontSize: '0.75rem', opacity: 0.5, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>LAST 30 DAYS</span>
                            </div>
                            <div style={{ background: '#0f172a', borderRadius: '20px', padding: '15px 0', border: '1px solid rgba(255,255,255,0.05)', height: '200px', overflow: 'hidden' }}>
                                <StockChart symbol="PORTFOLIO" range="1mo" holdings={user?.portfolio || []} trades={user?.trades || []} currentBalance={balance} />
                            </div>
                        </div>

                        {/* 3. Watchlist */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Watchlist</h3>
                                <i className="fa-solid fa-sliders" style={{ opacity: 0.4 }}></i>
                            </div>

                            <div className="m-watchlist-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {watchlist.map(symbol => {
                                    const data = watchlistQuotes[symbol] || {};
                                    const price = data.price || 0;
                                    const change = data.changePct || 0;
                                    const isUp = change >= 0;

                                    return (
                                        <div
                                            key={symbol}
                                            onClick={() => handleSelectStock(symbol)}
                                            style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden' }}
                                        >
                                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}></div>
                                            <div style={{ paddingLeft: '10px' }}>
                                                <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>{symbol}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>NSE</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: '700', fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}>₹{price.toFixed(2)}</div>
                                                <div style={{ fontSize: '0.8rem', color: isUp ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: '600' }}>
                                                    {isUp ? '+' : ''}{change.toFixed(2)}%
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {watchlist.length === 0 && <div style={{ opacity: 0.5, textAlign: 'center', padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>Watchlist is empty</div>}
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'analysis' && (
                    <section id="m-view-analysis" style={{ padding: '0 0 20px 0' }}>

                        {/* Stock Header */}
                        <div style={{ padding: '20px 20px 10px', background: 'linear-gradient(to bottom, rgba(15, 23, 42, 1), rgba(15, 23, 42, 0))' }}>
                            <div style={{ marginBottom: '5px' }}>
                                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>{selectedStock.split('.')[0]}</h1>
                                <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>NSE • REALTIME</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: (stockData?.changePct || 0) >= 0 ? '#fff' : '#fff' }}>
                                    {loadingData || !stockData ? <span style={{ opacity: 0.5, fontSize: '2rem' }}>Loading...</span> : `₹${stockData.price.toFixed(2)}`}
                                </div>
                                {!loadingData && stockData && (
                                    <div style={{
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        background: stockData.changePct >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                        color: stockData.changePct >= 0 ? '#4ade80' : '#f87171',
                                        fontSize: '0.9rem',
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}>
                                        <i className={`fa-solid fa-arrow-${stockData.changePct >= 0 ? 'up' : 'down'}`}></i>
                                        {Math.abs(stockData.changePct).toFixed(2)}%
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Chart Area */}
                        <div style={{ padding: '0 10px' }}>
                            {/* Controls ABOVE Chart */}
                            <div className="visible-scrollbar" style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px', marginBottom: '15px', overflowX: 'auto', padding: '0 10px' }}>
                                {ranges.map(r => (
                                    <button
                                        key={r.value}
                                        onClick={() => setRange(r.value)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            border: 'none',
                                            background: range === r.value ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.06)',
                                            color: range === r.value ? 'black' : 'rgba(255,255,255,0.7)',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            whiteSpace: 'nowrap',
                                            transition: 'all 0.2s ease',
                                            flex: 1,
                                            maxWidth: '60px'
                                        }}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>

                            {/* Chart Container - Clean, No Border */}
                            <div style={{ height: '300px', width: '100%', marginBottom: '20px' }}>
                                <StockChart symbol={selectedStock} range={range} />
                            </div>
                        </div>

                        {/* Stats Grid - "Where are the values?" */}
                        {stockData && (
                            <div style={{ padding: '0 20px', marginBottom: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '2px' }}>OPEN</div>
                                    <div style={{ fontWeight: 'bold' }}>₹{stockData.open?.toFixed(2) || '---'}</div>
                                </div>
                                <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '2px' }}>HIGH</div>
                                    <div style={{ fontWeight: 'bold', color: 'var(--accent-green)' }}>₹{stockData.high?.toFixed(2) || '---'}</div>
                                </div>
                                <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '2px' }}>LOW</div>
                                    <div style={{ fontWeight: 'bold', color: 'var(--accent-red)' }}>₹{stockData.low?.toFixed(2) || '---'}</div>
                                </div>
                            </div>
                        )}

                        <div style={{ padding: '0 15px' }}>
                            <TradePanel symbol={selectedStock} user={user} onTradeComplete={onTradeComplete} marketStatus={marketStatus} />
                        </div>
                    </section>
                )}

                {activeView === 'ai' && (
                    <section id="m-view-ai">
                        <AIChat selectedStockData={stockData} user={user} />
                    </section>
                )}

                {activeView === 'assets' && (
                    <section id="m-view-portfolio">
                        <div style={{ padding: '20px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px' }}>Your Assets</h3>
                            {user?.portfolio && user.portfolio.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {user.portfolio.map((item, idx) => (
                                        <div key={idx} style={{ background: '#1e293b', padding: '15px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{item.symbol}</div>
                                                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{item.quantity} shares</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 'bold' }}>₹{(item.avgPrice * item.quantity).toFixed(2)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ opacity: 0.6, textAlign: 'center', paddingTop: '50px', background: 'rgba(255,255,255,0.02)', padding: '40px', borderRadius: '16px' }}>
                                    <i className="fa-solid fa-folder-open" style={{ fontSize: '2rem', marginBottom: '15px', opacity: 0.5 }}></i>
                                    <div>No active holdings</div>
                                    <button onClick={() => setActiveView('home')} style={{ marginTop: '15px', padding: '8px 16px', background: 'var(--accent-cyan)', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Start Trading</button>
                                </div>
                            )}
                        </div>
                    </section>
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

            {/* PROFILE OVERLAY */}
            {isProfileOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'end', animation: 'fadeIn 0.2s ease' }} onClick={() => setIsProfileOpen(false)}>
                    <div style={{ background: '#0f172a', width: '100%', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingBottom: '40px', animation: 'slideUp 0.3s ease' }} onClick={e => e.stopPropagation()}>

                        {/* Drag Handle */}
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '15px 0' }}>
                            <div style={{ width: '50px', height: '5px', background: '#334155', borderRadius: '3px' }}></div>
                        </div>

                        {/* Profile Header */}
                        <div style={{ padding: '0 25px 25px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700' }}>Account</h3>
                                <button onClick={() => setIsProfileOpen(false)} style={{ background: '#334155', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            {/* User Card */}
                            <div style={{ background: 'linear-gradient(135deg, #1e293b, #020617)', padding: '25px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                                <div style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, var(--accent-blue), #3b82f6)', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '2rem', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                                    {user?.name?.[0] || 'U'}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.3rem', marginBottom: '4px' }}>{user?.name}</div>
                                    <div style={{ opacity: 0.6, fontSize: '0.9rem', marginBottom: '10px' }}>{user?.email}</div>
                                    <div style={{ display: 'inline-block', padding: '5px 12px', background: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid rgba(234, 179, 8, 0.3)', letterSpacing: '0.5px' }}>
                                        <i className="fa-solid fa-crown" style={{ marginRight: '5px' }}></i>PRO MEMBER
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                                <div style={{ background: '#1e293b', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ opacity: 0.6, fontSize: '0.75rem', marginBottom: '6px' }}>WALLET BALANCE</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>₹{balance.toLocaleString('en-IN')}</div>
                                </div>
                                <div style={{ background: '#1e293b', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ opacity: 0.6, fontSize: '0.75rem', marginBottom: '6px' }}>TOTAL TRADES</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{user?.portfolio?.length || 0}</div>
                                </div>
                            </div>

                            {/* Logout */}
                            <button
                                onClick={onLogout}
                                style={{ width: '100%', padding: '18px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', color: '#ef4444', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                            >
                                <i className="fa-solid fa-arrow-right-from-bracket"></i> Log Out
                            </button>

                            <div style={{ textAlign: 'center', marginTop: '25px', opacity: 0.4, fontSize: '0.75rem' }}>
                                TradePilot v2.1.0 • Build 2401
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
