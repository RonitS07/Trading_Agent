'use client';

import { useState, useEffect } from 'react';
import StockChart from './StockChart';

export default function OverviewTab({ user }) {
    const [quotes, setQuotes] = useState({});
    const [sentiment, setSentiment] = useState({ bullish: 65, bearish: 35 });
    const holdings = user?.portfolio || [];

    useEffect(() => {
        if (holdings.length === 0) return;

        // Fetch real data (Anchor)
        const fetchPrices = async () => {
            try {
                const symbols = holdings.map(h => h.symbol).join(',');
                const res = await fetch(`/api/quote?symbol=${symbols}`);
                const data = await res.json();

                const quoteMap = {};
                if (Array.isArray(data)) {
                    data.forEach(q => quoteMap[q.symbol] = q);
                } else if (data && data.symbol) {
                    quoteMap[data.symbol] = data;
                }

                // Merge with existing quotes to avoid flicker reset if possible, 
                // but here we just update the base anchor.
                setQuotes(prev => ({ ...prev, ...quoteMap }));

                // Mock sentiment based on NIFTY or aggregate performance
                const niftyRes = await fetch('/api/quote?symbol=^NSEI');
                const niftyData = await niftyRes.json();
                const niftyChange = niftyData.changePct || 0;
                const baseBullish = 50 + (niftyChange * 5);
                const finalBullish = Math.min(Math.max(baseBullish, 10), 90);
                setSentiment({ bullish: Math.round(finalBullish), bearish: 100 - Math.round(finalBullish) });
            } catch (e) {
                // Silent failure for UI polish
            }
        };

        // Rapid Simulation (Micro-movements)
        const simulateLive = () => {
            setQuotes(prevQuotes => {
                const nextQuotes = { ...prevQuotes };
                let hasChanges = false;

                for (const symbol in nextQuotes) {
                    const q = nextQuotes[symbol];
                    if (!q) continue;

                    // Random micro fluctuation: -0.1% to +0.1% of price
                    const volatility = 0.001;
                    const change = q.price * volatility * (Math.random() - 0.5);
                    const newPrice = q.price + change;

                    nextQuotes[symbol] = {
                        ...q,
                        price: newPrice,
                        changePct: ((newPrice - q.prevClose) / q.prevClose) * 100
                    };
                    hasChanges = true;
                }
                return hasChanges ? nextQuotes : prevQuotes;
            });
        };

        // Initial fetch
        fetchPrices();

        // Real data update every 30s
        const fetchInterval = setInterval(fetchPrices, 30000);

        // Simulation update every 800ms for "live" feel
        const simInterval = setInterval(simulateLive, 800);

        return () => {
            clearInterval(fetchInterval);
            clearInterval(simInterval);
        }
    }, [holdings]);

    // Formulas
    const invested = holdings.reduce((acc, h) => acc + (h.qty * h.avgCost), 0);
    const valuation = holdings.reduce((acc, h) => {
        const ltp = quotes[h.symbol]?.price || h.avgCost;
        return acc + (h.qty * ltp);
    }, 0);
    const unrealizedPL = valuation - invested;
    const balance = user?.balance || 0;
    const netWorth = balance + valuation;

    return (
        <div className="dashboard-grid">
            <div className="card overview-stats-card" style={{ gridColumn: 'span 2', padding: '0' }}>
                <div style={{ padding: '15px 20px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(0, 0, 0, 0))' }}>
                    <h1 style={{ fontSize: '0.7rem', opacity: 0.6, letterSpacing: '2px', textTransform: 'uppercase' }}>Portfolio Evolution</h1>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '10px' }}>
                        <div>
                            <span style={{ fontSize: '0.6rem', opacity: 0.6, fontWeight: '700' }}>NET WORTH</span>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>₹{netWorth.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.6rem', opacity: 0.6, fontWeight: '700' }}>INVESTED</span>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>₹{invested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.6rem', opacity: 0.6, fontWeight: '700' }}>TOTAL P&L</span>
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: '800',
                                color: (netWorth - 100000) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                                fontFamily: 'var(--font-mono)'
                            }}>
                                {(netWorth - 100000) >= 0 ? '+' : ''}₹{(netWorth - 100000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: (netWorth - 100000) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', opacity: 0.8 }}>
                                {(netWorth - 100000) >= 0 ? '+' : ''}{((netWorth - 100000) / 1000).toFixed(2)}%
                            </div>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.6rem', opacity: 0.6, fontWeight: '700' }}>AVAILABLE CASH</span>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card chart-card">
                <div className="card-header">
                    <h3>Portfolio Equity Curve</h3>
                    <div className="live-badge">LIVE <div className="live-dot"></div></div>
                </div>
                <div style={{ padding: '0', height: '280px' }}>
                    <StockChart symbol="PORTFOLIO" range="1mo" />
                </div>
            </div>

            <div className="card intelligence-card">
                <div className="card-header">
                    <h3>Portfolio Breakdown</h3>
                    <i className="fa-solid fa-chart-pie" style={{ color: 'var(--accent-cyan)' }}></i>
                </div>
                <div className="ai-box" style={{ background: 'transparent', padding: '0', maxHeight: '280px', overflowY: 'auto' }}>
                    {holdings.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', opacity: 0.4 }}>
                            <i className="fa-solid fa-folder-open" style={{ fontSize: '2rem', marginBottom: '10px', display: 'block' }}></i>
                            No assets in portfolio
                        </div>
                    ) : (
                        <div className="mini-holdings-list">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.65rem' }}>
                                        <th style={{ padding: '8px' }}>SYMBOL</th>
                                        <th style={{ padding: '8px' }}>QTY</th>
                                        <th style={{ padding: '8px' }}>AVG</th>
                                        <th style={{ padding: '8px' }}>LTP</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>VALUATION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {holdings.map(h => {
                                        const ltp = quotes[h.symbol]?.price || 0;
                                        const val = h.qty * (ltp || h.avgCost);
                                        return (
                                            <tr key={h.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>
                                                <td style={{ padding: '8px 10px', fontWeight: '700' }}>{h.symbol}</td>
                                                <td style={{ padding: '8px 10px' }}>{h.qty}</td>
                                                <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)' }}>{h.avgCost.toFixed(2)}</td>
                                                <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', color: ltp >= h.avgCost ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                                    {ltp ? ltp.toFixed(2) : '...'}
                                                </td>
                                                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                                                    ₹{val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="card sentiment-card">
                <div className="card-header">
                    <h3>Market Sentiment</h3>
                    <i className="fa-solid fa-gauge-high" style={{ color: 'var(--accent-magenta)' }}></i>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '10px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', fontWeight: '700' }}>
                        <span style={{ color: 'var(--accent-green)' }}>BULLISH {sentiment.bullish}%</span>
                        <span style={{ color: 'var(--accent-red)' }}>BEARISH {sentiment.bearish}%</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${sentiment.bullish}%`, background: 'var(--accent-green)', transition: 'width 1s ease' }}></div>
                        <div style={{ width: `${sentiment.bearish}%`, background: 'var(--accent-red)', transition: 'width 1s ease' }}></div>
                    </div>
                    <p style={{ marginTop: '10px', fontSize: '0.7rem', opacity: 0.6, lineHeight: '1.4' }}>
                        {sentiment.bullish > 60 ?
                            "High confidence in momentum. Market breadth is positive." :
                            "Market is in a consolidation phase. Selective buying advised."}
                    </p>
                </div>
            </div>
        </div>
    );
}
