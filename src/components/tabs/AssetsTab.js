'use client';

import { AssetListSkeleton } from '../LoadingSkeleton';

export default function AssetsTab({
    user,
    prices,
    handleSelectStock,
    setActiveView
}) {
    return (
        <section id="m-view-portfolio">
            <div style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px' }}>Your Assets</h3>
                {user?.portfolio && user.portfolio.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {user.portfolio.map((item, idx) => {
                            const currentPrice = prices[item.symbol]?.price || item.avgCost;
                            const currentValue = item.qty * currentPrice;
                            const investedValue = item.qty * item.avgCost;
                            const pnl = currentValue - investedValue;
                            const pnlPct = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleSelectStock(item.symbol)}
                                    style={{
                                        background: '#1e293b',
                                        padding: '15px',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{item.symbol}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{item.qty} shares @ ₹{item.avgCost.toFixed(2)}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 'bold' }}>₹{currentValue.toFixed(2)}</div>
                                        <div style={{ fontSize: '0.75rem', color: pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: '600' }}>
                                            {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)} ({pnlPct.toFixed(2)}%)
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ opacity: 0.6, textAlign: 'center', paddingTop: '50px', background: 'rgba(255,255,255,0.02)', padding: '40px', borderRadius: '16px' }}>
                        <i className="fa-solid fa-folder-open" style={{ fontSize: '2rem', marginBottom: '15px', opacity: 0.5 }}></i>
                        <div>No active holdings</div>
                        <button
                            onClick={() => setActiveView('home')}
                            style={{
                                marginTop: '15px',
                                padding: '8px 16px',
                                background: 'var(--accent-cyan)',
                                color: 'black',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Start Trading
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
