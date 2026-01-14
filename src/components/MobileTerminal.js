'use client';

import { useState, useEffect } from 'react';
import StockChart from './StockChart';
import AIChat from './AIChat';

export default function MobileTerminal({ user, onLogout }) {
    const [activeView, setActiveView] = useState('home');
    const [selectedStock, setSelectedStock] = useState('RELIANCE.NS');
    const [stockData, setStockData] = useState(null);

    useEffect(() => {
        const fetchStock = async () => {
            try {
                const res = await fetch(`/api/quote?symbol=${selectedStock}`);
                const data = await res.json();
                setStockData(data);
            } catch (e) { console.error(e); }
        };
        fetchStock();
    }, [selectedStock]);

    return (
        <div className="mobile-app-theme" style={{ background: '#020617', color: 'white', minHeight: '100vh', paddingBottom: '80px' }}>
            <header className="m-top-bar" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="m-profile-pill" onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="m-avatar" style={{ background: 'var(--accent-blue)', width: '35px', height: '35px', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                        {user?.name?.[0] || 'U'}
                    </div>
                    <div className="m-balance-group">
                        <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>WALLET</span>
                        <div style={{ fontWeight: 'bold' }}>₹{(user?.balance || 0).toLocaleString('en-IN')}</div>
                    </div>
                </div>
                <div className="m-market-chip" style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.7rem', color: '#22c55e' }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', marginRight: '5px' }}></span>
                    BSE LIVE
                </div>
            </header>

            <main style={{ padding: '15px' }}>
                {activeView === 'home' && (
                    <section id="m-view-home">
                        <div className="m-portfolio-card" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '20px', borderRadius: '24px', marginBottom: '25px' }}>
                            <div style={{ opacity: 0.6, fontSize: '0.7rem', marginBottom: '5px' }}>NET WORTH</div>
                            <h2 style={{ fontSize: '2rem', marginBottom: '15px' }}>₹{(user?.balance || 0).toLocaleString('en-IN')}</h2>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div>
                                    <div style={{ opacity: 0.6, fontSize: '0.6rem' }}>INVESTED</div>
                                    <div style={{ fontSize: '0.9rem' }}>₹0</div>
                                </div>
                                <div>
                                    <div style={{ opacity: 0.6, fontSize: '0.6rem' }}>P&L</div>
                                    <div style={{ fontSize: '0.9rem', color: '#22c55e' }}>+₹0.00</div>
                                </div>
                            </div>
                        </div>

                        <h3>WATCHLIST</h3>
                        <div className="m-scroll-list">
                            {['RELIANCE.NS', 'TCS.NS', 'INFY.NS'].map(sym => (
                                <div key={sym} onClick={() => { setSelectedStock(sym); setActiveView('analysis'); }} style={{ padding: '15px', background: '#1e293b', borderRadius: '16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{sym}</span>
                                    <span style={{ color: '#22c55e' }}>+1.2%</span>
                                </div>
                            ))}
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

                        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                            <button style={{ flex: 1, padding: '15px', borderRadius: '15px', background: '#22c55e', border: 'none', color: 'black', fontWeight: 'bold' }}>BUY</button>
                            <button style={{ flex: 1, padding: '15px', borderRadius: '15px', background: '#ef4444', border: 'none', color: 'white', fontWeight: 'bold' }}>SELL</button>
                        </div>
                    </section>
                )}

                {activeView === 'ai' && (
                    <section id="m-view-ai">
                        <AIChat selectedStockData={stockData} />
                    </section>
                )}

                {activeView === 'assets' && (
                    <section id="m-view-portfolio">
                        <h3>ACTIVE POSITIONS</h3>
                        <div style={{ opacity: 0.6, textAlign: 'center', paddingTop: '50px' }}>No active holdings</div>
                    </section>
                )}
            </main>

            <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0f172a', display: 'flex', justifyContent: 'space-around', padding: '15px', borderTop: '1px solid #1e293b', zIndex: 100 }}>
                <button onClick={() => setActiveView('home')} style={{ background: 'none', border: 'none', color: activeView === 'home' ? '#06b6d4' : '#64748b' }}><i className="fa-solid fa-house"></i></button>
                <button onClick={() => setActiveView('analysis')} style={{ background: 'none', border: 'none', color: activeView === 'analysis' ? '#06b6d4' : '#64748b' }}><i className="fa-solid fa-chart-line"></i></button>
                <button onClick={() => setActiveView('ai')} style={{ background: 'none', border: 'none', color: activeView === 'ai' ? '#06b6d4' : '#64748b' }}><i className="fa-solid fa-robot"></i></button>
                <button onClick={() => setActiveView('assets')} style={{ background: 'none', border: 'none', color: activeView === 'assets' ? '#06b6d4' : '#64748b' }}><i className="fa-solid fa-briefcase"></i></button>
            </nav>
        </div>
    );
}
