import { useState } from 'react';
import StockChart from './StockChart';
import TradePanel from './TradePanel';

export default function AnalysisTab({ user, symbol, stockData, onTradeComplete }) {
    const [range, setRange] = useState('1d');

    if (!symbol) return <div className="placeholder-msg">Select a stock from the sidebar</div>;

    const price = stockData?.price ? `₹${stockData.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '--';

    const ranges = [
        { label: '1D', value: '1d' },
        { label: '1W', value: '1w' },
        { label: '1M', value: '1mo' },
        { label: '6M', value: '6mo' },
        { label: '5Y', value: '5y' },
    ];

    return (
        <div className="analysis-view">
            <div className="analysis-left">
                <section className="card profile-card">
                    <div className="profile-header">
                        <div className="symbol-info">
                            <h1>{symbol}</h1>
                            <span className="sub-text">NSE Equity</span>
                        </div>
                        <div className="live-badge">LIVE</div>
                    </div>

                    <div className="profile-body">
                        <div className="price-hero">
                            <span className="main-price">{price}</span>
                        </div>
                    </div>

                    <div className="chart-controls" style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                        {ranges.map(r => (
                            <button
                                key={r.value}
                                onClick={() => setRange(r.value)}
                                className={`range-btn ${range === r.value ? 'active' : ''}`}
                                style={{
                                    padding: '5px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: range === r.value ? 'var(--accent-cyan)' : 'transparent',
                                    color: range === r.value ? 'black' : 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                }}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>

                    <div className="chart-section">
                        <StockChart symbol={symbol} range={range} />
                    </div>

                    <TradePanel symbol={symbol} user={user} onTradeComplete={onTradeComplete} />
                </section>
            </div>
        </div>
    );
}
