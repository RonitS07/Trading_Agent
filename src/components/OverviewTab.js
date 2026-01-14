'use client';

import StockChart from './StockChart';
import PortfolioSummary from './PortfolioSummary';

export default function OverviewTab({ user }) {
    const holdings = user?.portfolio || [];

    const invested = holdings.reduce((acc, h) => acc + (h.qty * h.avgCost), 0);
    const balance = user?.balance || 0;
    const netWorth = balance + invested;

    return (
        <div className="dashboard-grid">
            <div className="card overview-stats-card" style={{ gridColumn: 'span 2', padding: '0' }}>
                <div style={{ padding: '25px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(0, 0, 0, 0))' }}>
                    <h1 style={{ fontSize: '0.8rem', opacity: 0.6, letterSpacing: '2px', textTransform: 'uppercase' }}>Portfolio Evolution</h1>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '30px', marginTop: '20px' }}>
                        <div>
                            <span style={{ fontSize: '0.65rem', opacity: 0.6, fontWeight: '700' }}>NET WORTH</span>
                            <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>₹{netWorth.toLocaleString('en-IN')}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.65rem', opacity: 0.6, fontWeight: '700' }}>INVESTED</span>
                            <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>₹{invested.toLocaleString('en-IN')}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.65rem', opacity: 0.6, fontWeight: '700' }}>UNREALIZED P&L</span>
                            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>+₹0.00</div>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.65rem', opacity: 0.6, fontWeight: '700' }}>AVAILABLE CASH</span>
                            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>₹{balance.toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card chart-card">
                <div className="card-header">
                    <h3>Market Intelligence (NIFTY 50)</h3>
                    <div className="live-badge">LIVE <div className="live-dot"></div></div>
                </div>
                <div style={{ padding: '0', height: '350px' }}>
                    <StockChart symbol="^NSEI" range="1mo" />
                </div>
            </div>

            <div className="card intelligence-card">
                <div className="card-header">
                    <h3>Portfolio Breakdown</h3>
                    <i className="fa-solid fa-chart-pie" style={{ color: 'var(--accent-cyan)' }}></i>
                </div>
                <div className="ai-box" style={{ background: 'transparent', padding: '0' }}>
                    {holdings.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', opacity: 0.4 }}>
                            <i className="fa-solid fa-folder-open" style={{ fontSize: '2rem', marginBottom: '10px', display: 'block' }}></i>
                            No assets in portfolio
                        </div>
                    ) : (
                        <div className="mini-holdings-list">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>
                                        <th style={{ padding: '10px' }}>SYMBOL</th>
                                        <th style={{ padding: '10px' }}>HOLDING</th>
                                        <th style={{ padding: '10px' }}>AVG</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>VALUATION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {holdings.map(h => (
                                        <tr key={h.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                                            <td style={{ padding: '12px 10px', fontWeight: '700' }}>{h.symbol}</td>
                                            <td style={{ padding: '12px 10px' }}>{h.qty}</td>
                                            <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)' }}>{h.avgCost.toFixed(2)}</td>
                                            <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                                                ₹{(h.qty * h.avgCost).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
