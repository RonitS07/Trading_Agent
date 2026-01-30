import { useState, useEffect, useMemo, useRef } from 'react';
import { useLivePrices } from '@/hooks/useLivePrices';
import { usePortfolioContext } from '@/components/Providers';
import { useToast } from './Toast';

export default function Sidebar({ user, onSelectStock, isOpen, closeSidebar }) {
    const { refresh, watchlist, toggleWatchlist, quotes: prices } = usePortfolioContext();
    const showToast = useToast();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    const holdings = user?.portfolio || [];

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length >= 2) {
                try {
                    const res = await fetch(`/api/search?q=${query}`);
                    const data = await res.json();
                    setResults(data);
                    setShowResults(true);
                } catch (e) {
                    // Silent
                }
            } else {
                setResults([]);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    // Open Orders State
    const [openOrders, setOpenOrders] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const prevOrderCount = useRef(0);

    // Fetch Open Orders (Periodic for Lazy Execution Checks)
    useEffect(() => {
        if (!user) return;
        const fetchOrders = async () => {
            try {
                const res = await fetch('/api/orders');
                if (res.ok) {
                    const data = await res.json();

                    // If count changed (executed or cancelled), refresh portfolio data
                    if (data.length !== prevOrderCount.current) {
                        refresh();
                        prevOrderCount.current = data.length;
                    }

                    setOpenOrders(data);
                }
            } catch (e) { /* silent */ }
        };

        fetchOrders();
        const interval = setInterval(fetchOrders, 3000); // Check every 3s
        return () => clearInterval(interval);
    }, [user, refreshTrigger, refresh]);

    const cancelOrder = async (e, orderId) => {
        e.stopPropagation();
        if (!confirm('Cancel this order?')) return;
        try {
            const res = await fetch('/api/orders', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            });
            if (res.ok) {
                showToast('Order cancelled successfully', 'success');
                setRefreshTrigger(p => p + 1); // Refresh list
                refresh(); // Refresh balance via context
            }
        } catch (e) {
            showToast('Failed to cancel order', 'error');
        }
    };

    return (
        <aside className={`sidebar-left ${isOpen ? 'mobile-open' : ''}`}>
            {/* Mobile Overlay is actually better outside the aside to cover the main content, 
                 but for simplicity in this structure we can make the sidebar fixed full width transparent 
                 wrapper or just handle it via CSS on the sidebar itself.
                 Wait, the design was Sidebar as drawer.
                 Let's add a separate overlay div sibling if possible, but JSX structure requires one parent.
                 Let's wrap the return or just include it inside if CSS allows. 
                 Actually, best to put overlay inside aside but position it fixed behind? No, aside is the drawer.
                 We need to return a fragment.
             */}
            <div
                className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
                onClick={closeSidebar}
            />
            <div className="sidebar-inner-scroll">
                <div className="search-container">
                    <div className="search-input-wrapper">
                        <i className="fa-solid fa-magnifying-glass search-icon"></i>
                        <input
                            type="text"
                            id="omnibar-input"
                            placeholder="Search Stocks..."
                            autoComplete="off"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => query.length >= 2 && setShowResults(true)}
                        />
                        {showResults && results.length > 0 && (
                            <div id="search-results" className="search-dropdown">
                                {results.map((item) => (
                                    <div
                                        key={item.symbol}
                                        className="w-item"
                                        style={{ padding: '12px 15px' }}
                                        onClick={() => {
                                            onSelectStock(item.symbol);
                                            setQuery('');
                                            setShowResults(false);
                                        }}
                                    >
                                        <div className="w_top_search" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', marginRight: '10px' }}>
                                                <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{item.symbol}</span>
                                                <span style={{ fontSize: '0.7rem', opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {item.shortname}
                                                </span>
                                            </div>
                                            <i
                                                className={`fa-${watchlist.includes(item.symbol) ? 'solid' : 'regular'} fa-star`}
                                                style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '1rem', padding: '4px' }}
                                                onClick={(e) => toggleWatchlist(e, item.symbol)}
                                            ></i>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="sidebar-content">
                    {/* OPEN ORDERS SECTION */}
                    {openOrders.length > 0 && (
                        <div className="sidebar-section">
                            <div className="section-header">
                                <span className="section-title">
                                    OPEN ORDERS <i className="fa-solid fa-clock" style={{ fontSize: '0.7rem', verticalAlign: 'middle', marginLeft: '4px' }}></i>
                                </span>
                            </div>
                            <div className="watchlist-list">
                                {openOrders.map(order => (
                                    <div key={order.id} className="w-item" style={{ borderLeft: `3px solid ${order.action === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)'}` }}>
                                        <div className="w-top">
                                            <span>{order.symbol}</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{order.type}</span>
                                        </div>
                                        <div className="w-bot" style={{ justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                                                {order.action} {order.qty} @ {order.limitPrice || order.stopPrice}
                                            </span>
                                            <i
                                                className="fa-solid fa-xmark"
                                                style={{ color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                                                onClick={(e) => cancelOrder(e, order.id)}
                                                title="Cancel Order"
                                            ></i>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="sidebar-section">
                        <div className="section-header">
                            <span className="section-title">
                                WATCHLIST <i className="fa-solid fa-star" style={{ fontSize: '0.7rem', verticalAlign: 'middle', marginLeft: '4px' }}></i>
                            </span>
                        </div>
                        <div id="watchlist-container" className="watchlist-list">
                            {watchlist.map(sym => (
                                <div key={sym} className="w-item" onClick={() => onSelectStock && onSelectStock(sym)}>
                                    <div className="w-top">
                                        <span>{sym}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {prices[sym] ? (
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>₹{prices[sym].price.toFixed(2)}</div>
                                                    <span style={{ color: prices[sym].changePct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: '0.7rem' }}>
                                                        {prices[sym].changePct >= 0 ? '+' : ''}{prices[sym].changePct.toFixed(2)}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--accent-green)', fontSize: '0.7rem' }}>Loading...</span>
                                            )}
                                            <i
                                                className="fa-solid fa-star"
                                                style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.8rem' }}
                                                onClick={(e) => toggleWatchlist(e, sym)}
                                            ></i>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {watchlist.length === 0 && <div className="placeholder-text">Watchlist is empty</div>}
                        </div>
                    </div>

                    <div className="sidebar-section">
                        <div className="section-header">
                            <span className="section-title">HOLDINGS <i className="fa-solid fa-briefcase" style={{ fontSize: '0.7rem', verticalAlign: 'middle', marginLeft: '4px' }}></i></span>
                        </div>
                        <div className="watchlist-list">
                            {holdings.length === 0 ? (
                                <div className="placeholder-text">No active holdings</div>
                            ) : (
                                holdings.map(p => (
                                    <div key={p.symbol} className="w-item" onClick={() => onSelectStock && onSelectStock(p.symbol)}>
                                        <div className="w-top">
                                            <span>{p.symbol} ({p.qty})</span>
                                            {prices[p.symbol] ? (
                                                <span style={{ fontWeight: 'bold', color: prices[p.symbol].changePct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>₹{prices[p.symbol].price.toFixed(2)}</span>
                                            ) : (
                                                <span>--</span>
                                            )}
                                        </div>
                                        <div className="w-bot">
                                            <span>Avg: {p.avgCost.toFixed(2)}</span>
                                            {prices[p.symbol] && (
                                                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                                    P&L: <span style={{ color: (prices[p.symbol].price - p.avgCost) * p.qty >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                                        {((prices[p.symbol].price - p.avgCost) * p.qty).toFixed(2)}
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
