'use client';

import StockChart from '../StockChart';
import { WatchlistSkeleton } from '../LoadingSkeleton';

export default function HomeTab({
    user,
    netWorth,
    invested,
    balance,
    totalPnL,
    watchlist,
    watchlistQuotes,
    handleSelectStock,
    toggleWatchlist
}) {
    return (
        <div className="m-content" style={{ padding: '20px' }}>
            {/* 1. Net Worth Card */}
            <div style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', borderRadius: '24px', padding: '24px', marginBottom: '25px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--accent-cyan)', opacity: '0.05', filter: 'blur(50px)', borderRadius: '50%' }}></div>
                <div style={{ opacity: 0.7, fontSize: '0.85rem', marginBottom: '8px', letterSpacing: '0.5px' }}>NET WORTH</div>
                <div style={{ fontSize: '2.4rem', fontWeight: '800', fontFamily: 'var(--font-mono)', letterSpacing: '-1px' }}>₹{netWorth.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '20px' }}>
                    <div>
                        <div style={{ opacity: 0.6, fontSize: '0.7rem', marginBottom: '4px' }}>INVESTED</div>
                        <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
                            ₹{invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                    <div>
                        <div style={{ opacity: 0.6, fontSize: '0.7rem', marginBottom: '4px' }}>CASH</div>
                        <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
                            ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                    <div>
                        <div style={{ opacity: 0.6, fontSize: '0.7rem', marginBottom: '4px' }}>P&L</div>
                        <div style={{ color: totalPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 'bold', fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
                            {totalPnL >= 0 ? '+' : ''}₹{Math.abs(totalPnL).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Portfolio Performance Chart */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Performance</h3>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>LAST 30 DAYS</span>
                </div>
                <div style={{ background: '#0f172a', borderRadius: '20px', padding: '15px 0', border: '1px solid rgba(255,255,255,0.05)', height: '200px', overflow: 'hidden' }}>
                    <StockChart symbol="PORTFOLIO" range="1mo" holdings={user?.portfolio || []} trades={user?.trades || []} currentBalance={balance} />
                </div>
            </div>

            {/* 3. Watchlist */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Watchlist</h3>
                    <i className="fa-solid fa-sliders" style={{ opacity: 0.4 }}></i>
                </div>

                <div className="m-watchlist-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {watchlist.map(symbol => {
                        const data = watchlistQuotes[symbol] || {};
                        const price = data.price || 0;
                        const change = data.changePct || 0;
                        const isUp = change >= 0;

                        return (
                            <div
                                key={symbol}
                                onClick={() => handleSelectStock(symbol)}
                                style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                            >
                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}></div>
                                <div style={{ paddingLeft: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>{symbol}</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{symbol.endsWith('.BO') ? 'BSE' : 'NSE'}</div>
                                    </div>
                                    <i
                                        className="fa-solid fa-star"
                                        style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.9rem', opacity: 0.6 }}
                                        onClick={(e) => toggleWatchlist(e, symbol)}
                                    ></i>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: '700', fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}>₹{price.toFixed(2)}</div>
                                    <div style={{ fontSize: '0.8rem', color: isUp ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: '600' }}>
                                        {isUp ? '+' : ''}{change.toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {watchlist.length === 0 && <div style={{ opacity: 0.5, textAlign: 'center', padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>Watchlist is empty</div>}
                </div>
            </div>
        </div>
    );
}
