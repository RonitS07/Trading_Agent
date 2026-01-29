'use client';

import StockChart from '../StockChart';
import TradePanel from '../TradePanel';

export default function AnalysisTab({
    selectedStock,
    stockData,
    range,
    setRange,
    ranges,
    user,
    onTradeComplete,
    marketStatus
}) {
    return (
        <section id="m-view-analysis" style={{ padding: '0 0 20px 0' }}>
            {/* Stock Header */}
            <div style={{ padding: '20px 20px 10px', background: 'linear-gradient(to bottom, rgba(15, 23, 42, 1), rgba(15, 23, 42, 0))' }}>
                <div style={{ marginBottom: '5px' }}>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>{selectedStock.split('.')[0]}</h1>
                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{selectedStock.endsWith('.BO') ? 'BSE' : 'NSE'} • REALTIME</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: (stockData?.changePct || 0) >= 0 ? '#fff' : '#fff' }}>
                        {!stockData ? <span style={{ opacity: 0.5, fontSize: '2rem' }}>Loading...</span> : `₹${stockData.price.toFixed(2)}`}
                    </div>
                    {stockData && (
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
                                maxWidth: '60px',
                                cursor: 'pointer'
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

            {/* Stats Grid */}
            {stockData && (
                <div style={{ padding: '0 15px', marginBottom: '25px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    <div style={{ background: '#1e293b', padding: '10px 8px', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px' }}>OPEN</div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>₹{stockData.open?.toFixed(2) || '---'}</div>
                    </div>
                    <div style={{ background: '#1e293b', padding: '10px 8px', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px' }}>HIGH</div>
                        <div style={{ fontWeight: 'bold', color: 'var(--accent-green)', fontSize: '0.9rem' }}>₹{stockData.high?.toFixed(2) || '---'}</div>
                    </div>
                    <div style={{ background: '#1e293b', padding: '10px 8px', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px' }}>LOW</div>
                        <div style={{ fontWeight: 'bold', color: 'var(--accent-red)', fontSize: '0.9rem' }}>₹{stockData.low?.toFixed(2) || '---'}</div>
                    </div>
                    <div style={{ background: '#1e293b', padding: '10px 8px', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px' }}>PREV</div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>₹{stockData.prevClose?.toFixed(2) || '---'}</div>
                    </div>
                </div>
            )}

            <div style={{ padding: '0 15px' }}>
                <TradePanel symbol={selectedStock} user={user} onTradeComplete={onTradeComplete} marketStatus={marketStatus} />
            </div>
        </section>
    );
}
