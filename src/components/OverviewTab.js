'use client';

import StockChart from './StockChart';

export default function OverviewTab() {
    return (
        <div className="dashboard-grid">
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
                    <h3>AI Market Intelligence</h3>
                    <i className="fa-solid fa-robot"></i>
                </div>
                <div className="ai-box">
                    <p className="blink">Market Sentiment: PROCESSING...</p>
                    <p style={{ marginTop: '15px', opacity: 0.8 }}>Analyzing global indices and volatility.</p>
                </div>
            </div>
        </div>
    );
}
