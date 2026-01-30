import { useState, useEffect, useMemo } from 'react';
import { useLivePrices } from '@/hooks/useLivePrices';
import { usePortfolioContext } from '@/components/Providers';

export default function Sidebar({ user, onSelectStock, isOpen, closeSidebar }) {
    const { refresh } = usePortfolioContext();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    // Watchlist State
    const [watchlist, setWatchlist] = useState([]);
    const [isSynced, setIsSynced] = useState(false);

    const holdings = user?.portfolio || [];

    // Combine for pricing
    const allSymbols = useMemo(() => {
        const holdingSymbols = holdings.map(h => h.symbol);
        return [...new Set([...watchlist, ...holdingSymbols])];
    }, [watchlist, holdings]);

    const prices = useLivePrices(allSymbols);

    // Initial Sync: DB -> Local
    useEffect(() => {
        if (!user) {
            const saved = localStorage.getItem('tp_watchlist');
            if (saved) setWatchlist(JSON.parse(saved));
            return;
        }

        const fetchWatchlist = async () => {
            try {
                const res = await fetch('/api/watchlist');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setWatchlist(data);
                        setIsSynced(true);
                        localStorage.setItem('tp_watchlist', JSON.stringify(data));
                    }
                }
            } catch (e) {
                // console.error("Watchlist sync failed", e);
            }
        };
        fetchWatchlist();
    }, [user]);

    const toggleWatchlist = async (e, symbol) => {
        e.stopPropagation();
        let newWatchlist;
        let action;

        if (watchlist.includes(symbol)) {
            newWatchlist = watchlist.filter(s => s !== symbol);
            action = 'REMOVE';
        } else {
            newWatchlist = [...watchlist, symbol];
            action = 'ADD';
        }

        setWatchlist(newWatchlist);
        localStorage.setItem('tp_watchlist', JSON.stringify(newWatchlist));

        // Background Sync
        if (user) {
            try {
                await fetch('/api/watchlist', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ symbol, action })
                });
            } catch (e) {
                // Revert on serious error? enhanced: Notification
            }
        }
    };

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

    // Fetch Open Orders (Periodic for Lazy Execution Checks)
    useEffect(() => {
        if (!user) return;
        const fetchOrders = async () => {
            try {
                const res = await fetch('/api/orders');
                if (res.ok) {
                    const data = await res.json();
                    setOpenOrders(data);
                }
            } catch (e) { /* silent */ }
        };

        fetchOrders();
        const interval = setInterval(fetchOrders, 5000); // Check every 5s
        return () => clearInterval(interval);
    }, [user, refreshTrigger]);

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
                setRefreshTrigger(p => p + 1); // Refresh list
                refresh(); // Refresh balance via context
            }
        } catch (e) {
            alert('Failed to cancel');
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
                                        onClick={() => {
                                            onSelectStock(item.symbol);
                                            setQuery('');
                                            setShowResults(false);
                                        }}
                                    >
                                        <div className="w-top">
                                            <span>{item.symbol}</span>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{item.shortname}</span>
                                                <i
                                                    className={`fa-${watchlist.includes(item.symbol) ? 'solid' : 'regular'} fa-star`}
                                                    style={{ color: 'var(--accent-cyan)', cursor: 'pointer' }}
                                                    onClick={(e) => toggleWatchlist(e, item.symbol)}
                                                ></i>
                                            </div>
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
