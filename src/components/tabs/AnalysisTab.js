'use client';

import { useState, useEffect, useRef } from 'react';
import StockChart from '../StockChart';
import TradePanel from '../TradePanel';
import { usePortfolioContext } from '../Providers';
import { useLivePrices } from '@/hooks/useLivePrices';

export default function AnalysisTab({
    selectedStock,
    stockData: initialData,
    range = '1d',
    setRange = () => { },
    ranges = [],
    user,
    onTradeComplete,
    marketStatus,
    watchlist: propWatchlist,
    toggleWatchlist: propToggle
}) {
    const { watchlist: contextWatchlist, toggleWatchlist: contextToggle, quotes: contextQuotes } = usePortfolioContext() || {};

    // Subscribe to live price for THIS stock explicitly
    const localQuotes = useLivePrices([selectedStock]);

    // Support both prop and context
    const watchlist = contextWatchlist || propWatchlist;
    const toggleWatchlist = contextToggle || propToggle;

    // Priority: Local live quote > context quotes > initial fetch data
    const stockData = localQuotes[selectedStock] || contextQuotes?.[selectedStock] || initialData;
    // Define isInWatchlist at the top level
    const isInWatchlist = watchlist?.includes(selectedStock);

    const [priceChanged, setPriceChanged] = useState(false);
    const prevPriceRef = useRef(null);

    // Pulse animation trigger when price changes
    useEffect(() => {
        if (stockData?.price !== undefined) {
            if (prevPriceRef.current !== null && prevPriceRef.current !== stockData.price) {
                setPriceChanged(true);
                const t = setTimeout(() => setPriceChanged(false), 400);
                return () => clearTimeout(t);
            }
            prevPriceRef.current = stockData.price;
        }
    }, [stockData?.price]);

    return (
        <section id="m-view-analysis" style={{ padding: '0 0 20px 0' }}>
            {/* Stock Header */}
            <div style={{ padding: '20px 20px 10px', background: 'linear-gradient(to bottom, rgba(15, 23, 42, 1), rgba(15, 23, 42, 0))' }}>
                <div style={{ marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>{selectedStock.split('.')[0]}</h1>
                    <i
                        className={`fa-${isInWatchlist ? 'solid' : 'regular'} fa-star`}
                        onClick={(e) => toggleWatchlist(e, selectedStock)}
                        style={{
                            color: isInWatchlist ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.4)',
                            cursor: 'pointer',
                            fontSize: '1.3rem',
                            padding: '5px'
                        }}
                    />
                </div>
                <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>
                    {selectedStock.endsWith('.BO') ? 'BSE' : 'NSE'} • {marketStatus?.open ? 'LIVE' : 'DELAYED'}
                </span>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '5px' }}>
                    <div
                        className={priceChanged ? 'price-pulse' : ''}
                        style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#fff' }}
                    >
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

            {/* Chart Area - Enclosed in a Premium Box Container */}
            <div style={{ padding: '0 15px', marginBottom: '25px' }}>
                <div style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    padding: '20px 0 10px 0',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    overflow: 'hidden'
                }}>
                    {/* Controls INSIDE the container for a unified look */}
                    <div className="visible-scrollbar" style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        gap: '8px',
                        marginBottom: '15px',
                        overflowX: 'auto',
                        padding: '0 15px'
                    }}>
                        {ranges.map(r => (
                            <button
                                key={r.value}
                                onClick={() => setRange(r.value)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '16px',
                                    border: 'none',
                                    background: range === r.value ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                                    color: range === r.value ? 'black' : 'rgba(255,255,255,0.6)',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s ease',
                                    flex: 1,
                                    maxWidth: '65px',
                                    cursor: 'pointer'
                                }}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>

                    {/* Chart with precise padding */}
                    <div style={{ height: '300px', width: '100%', position: 'relative' }}>
                        <StockChart symbol={selectedStock} range={range} />
                    </div>
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

            <div style={{ padding: '0 15px', marginBottom: '30px' }}>
                <TradePanel symbol={selectedStock} user={user} onTradeComplete={onTradeComplete} marketStatus={marketStatus} />
            </div>
        </section>
    );
}

