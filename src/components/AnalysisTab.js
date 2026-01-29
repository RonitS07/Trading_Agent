import { useState, useMemo } from 'react';
import StockChart from './StockChart';
import TradePanel from './TradePanel';
import { useLivePrices } from '@/hooks/useLivePrices';

export default function AnalysisTab({ user, symbol, stockData: initialData, onTradeComplete, marketStatus }) {
    const [range, setRange] = useState('1d');

    // Live Price Hook
    // We pass array of symbols, so wrap symbol in array. useMemo prevents infinite loop in hook dependency.
    const symbols = useMemo(() => symbol ? [symbol] : [], [symbol]);
    const livePrices = useLivePrices(symbols);

    // Merge initial Data with Live Data
    const stockData = livePrices[symbol] || initialData;

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
                            <span className="sub-text">{symbol.endsWith('.BO') ? 'BSE' : 'NSE'} Equity</span>
                        </div>
                        <div className="live-badge">LIVE</div>
                    </div>

                    <div className="profile-body">
                        <div className="price-hero">
                            <span className="main-price">{price}</span>
                            {stockData?.changePct !== undefined && (
                                <span className={`change-tag ${stockData.changePct >= 0 ? 'up' : 'down'}`}>
                                    {stockData.changePct >= 0 ? '+' : ''}{stockData.changePct.toFixed(2)}%
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid - matches mobile version */}
                    {stockData && (
                        <div className="stats-grid" style={{ marginBottom: '15px' }}>
                            <div className="stat-box">
                                <span className="label">OPEN</span>
                                <span className="value">₹{stockData.open?.toFixed(2) || '--'}</span>
                            </div>
                            <div className="stat-box">
                                <span className="label">HIGH</span>
                                <span className="value" style={{ color: 'var(--accent-green)' }}>₹{stockData.high?.toFixed(2) || '--'}</span>
                            </div>
                            <div className="stat-box">
                                <span className="label">LOW</span>
                                <span className="value" style={{ color: 'var(--accent-red)' }}>₹{stockData.low?.toFixed(2) || '--'}</span>
                            </div>
                            <div className="stat-box">
                                <span className="label">PREV CLOSE</span>
                                <span className="value">₹{stockData.prevClose?.toFixed(2) || '--'}</span>
                            </div>
                        </div>
                    )}

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

                    <TradePanel symbol={symbol} user={user} onTradeComplete={onTradeComplete} marketStatus={marketStatus} />
                </section>
            </div>
        </div>
    );
}
