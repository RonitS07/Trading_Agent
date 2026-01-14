'use client';

import StockChart from './StockChart';
import PortfolioSummary from './PortfolioSummary';

export default function OverviewTab({ user }) {
    const holdings = user?.portfolio || [];

    return (
        <div className="dashboard-grid">
            <div className="card overview-stats-card" style={{ gridColumn: 'span 2' }}>
                <PortfolioSummary user={user} />
            </div>

            <div className="card chart-card">
                <div className="card-header">
                    <h3>Market Overview (NIFTY 50)</h3>
                </div>
                <div style={{ padding: '0', height: '320px' }}>
                    <StockChart symbol="^NSEI" range="1mo" />
                </div>
            </div>

            <div className="card intelligence-card">
                <div className="card-header">
                    <h3>My Holdings</h3>
                    <i className="fa-solid fa-briefcase"></i>
                </div>
                <div className="ai-box">
                    {holdings.length === 0 ? (
                        <p style={{ opacity: 0.6 }}>No active holdings to display.</p>
                    ) : (
                        <div className="mini-holdings-list">
                            {holdings.slice(0, 5).map(h => (
                                <div key={h.symbol} className="mini-holding-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span>{h.symbol}</span>
                                    <span>{h.qty} @ ₹{h.avgCost.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
