'use client';

import { useState, useEffect } from 'react';
import StockChart from './StockChart';
import { usePortfolioData } from '@/hooks/usePortfolioData';

export default function OverviewTab({ user, onSelectStock }) {
    const {
        quotes,
        holdings,
        netWorth,
        invested,
        unrealizedPL,
        unrealizedPLPct,
        balance,
        totalPL,
        totalPLPct
    } = usePortfolioData(user);

    const [sentiment, setSentiment] = useState({ bullish: 65, bearish: 35 });

    // Enhanced Sentiment Logic (Phase 3)
    useEffect(() => {
        const fetchSentiment = async () => {
            try {
                // Fetch NIFTY to gauge market direction
                const niftyRes = await fetch('/api/quote?symbol=^NSEI');
                const niftyData = await niftyRes.json();

                // Fetch VIX if possible (Symbol for India VIX often differ, using fallback logic)
                // For now, heuristic based on NIFTY change magnitude
                const change = niftyData.changePct || 0;
                const absChange = Math.abs(change);

                // Base bullish score (0-100)
                // If change is +1%, bullish = 75. If -1%, bullish = 25.
                let baseBullish = 50 + (change * 25);
                baseBullish = Math.min(Math.max(baseBullish, 15), 85);

                // Confidence based on magnitude of move
                let confidence = "Low";
                if (absChange > 0.5) confidence = "Moderate";
                if (absChange > 1.0) confidence = "High";

                // Reasoning generation
                let reason = "Market is trading flat.";
                if (change > 0.5) reason = "Strong buying momentum driven by index heavyweights.";
                else if (change < -0.5) reason = "Profit booking visible at higher levels.";
                else if (change > 0) reason = "Mildly positive bias with consolidation.";

                setSentiment({
                    bullish: Math.round(baseBullish),
                    bearish: 100 - Math.round(baseBullish),
                    confidence,
                    reason
                });
            } catch (e) { /* silent */ }
        };
        fetchSentiment();
    }, []);

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
                                color: totalPL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                                fontFamily: 'var(--font-mono)'
                            }}>
                                {totalPL >= 0 ? '+' : ''}₹{totalPL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: totalPL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', opacity: 0.8 }}>
                                {totalPL >= 0 ? '+' : ''}{totalPLPct.toFixed(2)}%
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
                    <StockChart
                        symbol="PORTFOLIO"
                        range="1d"
                        holdings={holdings}
                        trades={user.trades}
                        currentBalance={balance}
                    />
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
                                        <th style={{ padding: '8px', textAlign: 'right' }}>P&L</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>VALUATION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {holdings.map(h => {
                                        const ltp = quotes[h.symbol]?.price || 0;
                                        const val = h.qty * (ltp || h.avgCost);
                                        const invested = h.qty * h.avgCost;
                                        const pnl = val - invested;
                                        const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                                        return (
                                            <tr
                                                key={h.symbol}
                                                onClick={() => onSelectStock && onSelectStock(h.symbol)}
                                                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', cursor: onSelectStock ? 'pointer' : 'default', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ padding: '8px 10px', fontWeight: '700' }}>{h.symbol}</td>
                                                <td style={{ padding: '8px 10px' }}>{h.qty}</td>
                                                <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)' }}>{h.avgCost.toFixed(2)}</td>
                                                <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', color: ltp >= h.avgCost ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                                    {ltp ? ltp.toFixed(2) : '...'}
                                                </td>
                                                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: '600' }}>
                                                    {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)} ({pnl >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.65rem', opacity: 0.7, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                            {sentiment.confidence || 'Mod'} Conf.
                        </span>
                        <i className="fa-solid fa-gauge-high" style={{ color: 'var(--accent-magenta)' }}></i>
                    </div>
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
                    <p style={{ marginTop: '15px', fontSize: '0.75rem', opacity: 0.8, lineHeight: '1.4', borderLeft: '2px solid var(--accent-cyan)', paddingLeft: '10px' }}>
                        {sentiment.reason || "Market is in a consolidation phase. Selective buying advised."}
                    </p>
                </div>
            </div>
        </div>
    );
}

