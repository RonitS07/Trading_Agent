'use client';

import { useState, useEffect } from 'react';
import StockChart from './StockChart';
import AIChat from './AIChat';
import TradePanel from './TradePanel';

export default function MobileTerminal({ user, onLogout, onTradeComplete }) {
    const [activeView, setActiveView] = useState('home');
    const [selectedStock, setSelectedStock] = useState('RELIANCE.NS');
    const [stockData, setStockData] = useState(null);
    const [watchlist, setWatchlist] = useState(['RELIANCE.NS', 'TCS.NS', 'INFY.NS']);
    const [watchlistQuotes, setWatchlistQuotes] = useState({});

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

    // 1. Fetch & Simulate Logic
    useEffect(() => {
        // Fetch Real Data for Watchlist & Selected
        const fetchAllData = async () => {
            try {
                // Combine watchlist + selected stock (dedupe)
                const allSymbols = [...new Set([...watchlist, selectedStock])];
                const res = await fetch(`/api/quote?symbol=${allSymbols.join(',')}`);
                const data = await res.json();

                const quoteMap = {};
                if (Array.isArray(data)) {
                    data.forEach(q => quoteMap[q.symbol] = q);
                } else if (data && data.symbol) {
                    quoteMap[data.symbol] = data;
                }

                // Update Watchlist Quotes
                setWatchlistQuotes(prev => ({ ...prev, ...quoteMap }));

                // Update Selected Stock Data
                if (quoteMap[selectedStock]) {
                    setStockData(quoteMap[selectedStock]);
                }
            } catch (e) { /* silent */ }
        };

        // Rapid Simulation (Micro-movements) for BOTH Watchlist and Selected Stock
        const simulateLive = () => {
            // 1. Simulate Watchlist
            setWatchlistQuotes(prev => {
                const next = { ...prev };
                let hasChanges = false;
                for (const k in next) {
                    const q = next[k];
                    if (!q) continue;
                    const change = q.price * 0.001 * (Math.random() - 0.5);
                    const newPrice = q.price + change;
                    next[k] = { ...q, price: newPrice, changePct: ((newPrice - q.prevClose) / q.prevClose) * 100 };
                    hasChanges = true;
                }
                return hasChanges ? next : prev;
            });

            // 2. Simulate Selected Stock Data (if separate state is kept, but let's sync it from quotes?)
            // Actually, best to just keep stockData synced from watchlistQuotes if possible, 
            // but for safety let's drift it too if it's not in watchlistQuotes for some reason,
            // OR simpler: just update stockData based on the same logic.
            setStockData(prev => {
                if (!prev) return prev;
                const change = prev.price * 0.001 * (Math.random() - 0.5);
                const newPrice = prev.price + change;
                return { ...prev, price: newPrice, changePct: ((newPrice - prev.prevClose) / prev.prevClose) * 100 };
            });
        };

        fetchAllData();
        const fetchInterval = setInterval(fetchAllData, 30000);
        const simInterval = setInterval(simulateLive, 800);

        return () => {
            clearInterval(fetchInterval);
            clearInterval(simInterval);
        };
    }, [watchlist, selectedStock]);

    // Keep stockData in sync if we switch selectedStock
    useEffect(() => {
        if (watchlistQuotes[selectedStock]) {
            setStockData(watchlistQuotes[selectedStock]);
        }
    }, [selectedStock, watchlistQuotes]); // Dependency on quotes ensures fresh data on switch

    const [valuation, setValuation] = useState(0);

    useEffect(() => {
        const holdings = user?.portfolio || [];
        if (holdings.length === 0) { setValuation(0); return; }
        const fetchValuation = async () => {
            try {
                const symbols = holdings.map(h => h.symbol).join(',');
                const res = await fetch(`/api/quote?symbol=${symbols}`);
                const data = await res.json();
                let totalVal = 0;
                if (Array.isArray(data)) {
                    data.forEach(q => {
                        const h = holdings.find(item => item.symbol === q.symbol);
                        totalVal += h ? h.qty * q.price : 0;
                    });
                } else {
                    const h = holdings.find(item => item.symbol === data.symbol);
                    totalVal = h ? h.qty * data.price : 0;
                }
                setValuation(totalVal);
            } catch (e) { /* silent */ }
        };
        fetchValuation();
        const vInterval = setInterval(fetchValuation, 30000); // Also update valuation periodically
        return () => clearInterval(vInterval);
    }, [user?.portfolio]);

    const balance = user?.balance || 0;
    const netWorth = balance + valuation;
    const invested = (user?.portfolio || []).reduce((acc, h) => acc + (h.qty * h.avgCost), 0);
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
        <div className="mobile-app-theme" style={{ background: '#020617', color: 'white', minHeight: '100vh', paddingBottom: '80px', position: 'relative' }}>
            {/* Header */}
            <header className="m-top-bar" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                    className="m-profile-pill"
                    onClick={() => setIsProfileOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                >
                    <div className="m-avatar" style={{ background: 'var(--accent-blue)', width: '35px', height: '35px', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                        {user?.name?.[0] || 'U'}
                    </div>
                    <div className="m-balance-group">
                        <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>WALLET</span>
                        <div style={{ fontWeight: 'bold' }}>₹{balance.toLocaleString('en-IN')}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div
                        onClick={() => setIsSearchOpen(true)}
                        style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                    >
                        <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--accent-cyan)' }}></i>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ padding: '15px' }}>
                {activeView === 'home' && (
                    <section id="m-view-home">
                        <div className="m-portfolio-card" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '20px', borderRadius: '24px', marginBottom: '25px' }}>
                            <div style={{ opacity: 0.6, fontSize: '0.7rem', marginBottom: '5px' }}>NET WORTH</div>
                            <h2 style={{ fontSize: '2rem', marginBottom: '15px' }}>₹{netWorth.toLocaleString('en-IN')}</h2>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div>
                                    <div style={{ opacity: 0.6, fontSize: '0.6rem' }}>INVESTED</div>
                                    <div style={{ fontSize: '0.9rem' }}>₹{invested.toLocaleString('en-IN')}</div>
                                </div>
                                <div>
                                    <div style={{ opacity: 0.6, fontSize: '0.6rem' }}>TOTAL P&L</div>
                                    <div style={{ fontSize: '0.9rem', color: totalPnL >= 0 ? '#22c55e' : '#ef4444' }}>
                                        {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h3>WATCHLIST</h3>
                        <div className="m-scroll-list">
                            {watchlist.map(sym => {
                                const q = watchlistQuotes[sym];
                                const price = q ? q.price.toFixed(2) : '...';
                                const change = q ? q.changePct : 0;
                                const isUp = change >= 0;

                                return (
                                    <div key={sym} onClick={() => { setSelectedStock(sym); setActiveView('analysis'); }} style={{ padding: '15px', background: '#1e293b', borderRadius: '16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: '600' }}>{sym}</span>
                                            <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>NSE</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>₹{price}</div>
                                            <div style={{ fontSize: '0.75rem', color: isUp ? '#22c55e' : '#ef4444' }}>
                                                {isUp ? '+' : ''}{change.toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {watchlist.length === 0 && <div style={{ opacity: 0.5, textAlign: 'center', padding: '20px' }}>Watchlist is empty</div>}
                        </div>
                    </section>
                )}

                {activeView === 'analysis' && (
                    <section id="m-view-analysis">
                        <div style={{ marginBottom: '20px' }}>
                            <h1 style={{ margin: 0 }}>{selectedStock.split('.')[0]}</h1>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#06b6d4' }}>
                                ₹{stockData?.price?.toFixed(2) || '---'}
                            </div>
                        </div>

                        <div style={{ height: '250px', background: '#0f172a', borderRadius: '20px', overflow: 'hidden', border: '1px solid #1e293b' }}>
                            <StockChart symbol={selectedStock} range="1d" />
                        </div>

                        <TradePanel symbol={selectedStock} user={user} onTradeComplete={onTradeComplete} />
                    </section>
                )}

                {activeView === 'ai' && (
                    <section id="m-view-ai">
                        <AIChat selectedStockData={stockData} user={user} />
                    </section>
                )}

                {activeView === 'assets' && (
                    <section id="m-view-portfolio">
                        <h3>ACTIVE POSITIONS</h3>
                        <div style={{ opacity: 0.6, textAlign: 'center', paddingTop: '50px' }}>No active holdings</div>
                    </section>
                )}
            </main>

            {/* Bottom Nav */}
            <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0f172a', display: 'flex', justifyContent: 'space-around', padding: '15px', borderTop: '1px solid #1e293b', zIndex: 100 }}>
                <button onClick={() => setActiveView('home')} style={{ background: 'none', border: 'none', color: activeView === 'home' ? '#06b6d4' : '#64748b' }}><i className="fa-solid fa-house"></i></button>
                <button onClick={() => setActiveView('analysis')} style={{ background: 'none', border: 'none', color: activeView === 'analysis' ? '#06b6d4' : '#64748b' }}><i className="fa-solid fa-chart-line"></i></button>
                <button onClick={() => setActiveView('ai')} style={{ background: 'none', border: 'none', color: activeView === 'ai' ? '#06b6d4' : '#64748b' }}><i className="fa-solid fa-robot"></i></button>
                <button onClick={() => setActiveView('assets')} style={{ background: 'none', border: 'none', color: activeView === 'assets' ? '#06b6d4' : '#64748b' }}><i className="fa-solid fa-briefcase"></i></button>
            </nav>

            {/* SEARCH OVERLAY */}
            {isSearchOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#020617', zIndex: 200, padding: '20px', animation: 'fadeIn 0.2s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                        <i className="fa-solid fa-arrow-left" onClick={() => setIsSearchOpen(false)} style={{ fontSize: '1.2rem' }}></i>
                        <input
                            type="text"
                            autoFocus
                            placeholder="Search stocks..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ width: '100%', background: '#1e293b', border: 'none', padding: '12px', borderRadius: '10px', color: 'white', outline: 'none' }}
                        />
                    </div>
                    <div>
                        {searchResults.map(item => (
                            <div key={item.symbol} onClick={() => handleSelectStock(item.symbol)} style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{item.symbol}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{item.shortname}</div>
                                </div>
                                <i
                                    className={`fa-${watchlist.includes(item.symbol) ? 'solid' : 'regular'} fa-star`}
                                    style={{ color: 'var(--accent-cyan)', padding: '10px' }}
                                    onClick={(e) => toggleWatchlist(e, item.symbol)}
                                ></i>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PROFILE OVERLAY */}
            {isProfileOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 300, display: 'flex', alignItems: 'end', animation: 'fadeIn 0.2s ease' }} onClick={() => setIsProfileOpen(false)}>
                    <div style={{ background: '#0f172a', width: '100%', borderTopLeftRadius: '25px', borderTopRightRadius: '25px', borderTop: '1px solid #1e293b', paddingBottom: '30px', animation: 'slideUp 0.3s ease' }} onClick={e => e.stopPropagation()}>

                        {/* Drag Handle */}
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '15px 0' }}>
                            <div style={{ width: '40px', height: '4px', background: '#334155', borderRadius: '2px' }}></div>
                        </div>

                        {/* Profile Header */}
                        <div style={{ padding: '0 25px 25px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Account</h3>
                                <button onClick={() => setIsProfileOpen(false)} style={{ background: '#334155', border: 'none', color: 'white', width: '30px', height: '30px', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            {/* User Card */}
                            <div style={{ background: 'linear-gradient(135deg, #1e293b, #020617)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' }}>
                                <div style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, var(--accent-blue), #3b82f6)', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '2rem', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                                    {user?.name?.[0] || 'U'}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '4px' }}>{user?.name}</div>
                                    <div style={{ opacity: 0.6, fontSize: '0.8.5rem', marginBottom: '8px' }}>{user?.email}</div>
                                    <div style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                                        <i className="fa-solid fa-crown" style={{ marginRight: '5px' }}></i>PRO MEMBER
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                                <div style={{ background: '#1e293b', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ opacity: 0.6, fontSize: '0.7rem', marginBottom: '5px' }}>WALLET BALANCE</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>₹{balance.toLocaleString('en-IN')}</div>
                                </div>
                                <div style={{ background: '#1e293b', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ opacity: 0.6, fontSize: '0.7rem', marginBottom: '5px' }}>TOTAL TRADES</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{user?.portfolio?.length || 0}</div>
                                </div>
                            </div>

                            {/* Menu Actions */}
                            <div style={{ marginBottom: '25px' }}>
                                <div style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                                    <div style={{ width: '35px', height: '35px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'grid', placeItems: 'center' }}><i className="fa-solid fa-gear" style={{ color: '#94a3b8' }}></i></div>
                                    <span style={{ flex: 1 }}>Settings</span>
                                    <i className="fa-solid fa-chevron-right" style={{ opacity: 0.3, fontSize: '0.8rem' }}></i>
                                </div>
                                <div style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                                    <div style={{ width: '35px', height: '35px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'grid', placeItems: 'center' }}><i className="fa-solid fa-circle-question" style={{ color: '#94a3b8' }}></i></div>
                                    <span style={{ flex: 1 }}>Help & Support</span>
                                    <i className="fa-solid fa-chevron-right" style={{ opacity: 0.3, fontSize: '0.8rem' }}></i>
                                </div>
                            </div>

                            {/* Logout */}
                            <button
                                onClick={onLogout}
                                style={{ width: '100%', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', color: '#ef4444', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                            >
                                <i className="fa-solid fa-arrow-right-from-bracket"></i> Log Out
                            </button>

                            <div style={{ textAlign: 'center', marginTop: '20px', opacity: 0.4, fontSize: '0.7rem' }}>
                                TradePilot v2.1.0 • Build 2401
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
