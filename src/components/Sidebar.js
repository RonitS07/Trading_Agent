import { useState, useEffect } from 'react';

export default function Sidebar({ user, onSelectStock }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [watchlist, setWatchlist] = useState(['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'SBIN.NS']);
    const holdings = user?.portfolio || [];

    useEffect(() => {
        const saved = localStorage.getItem('tp_watchlist');
        if (saved) setWatchlist(JSON.parse(saved));
    }, []);

    const toggleWatchlist = (e, symbol) => {
        e.stopPropagation();
        let newWatchlist;
        if (watchlist.includes(symbol)) {
            newWatchlist = watchlist.filter(s => s !== symbol);
        } else {
            newWatchlist = [...watchlist, symbol];
        }
        setWatchlist(newWatchlist);
        localStorage.setItem('tp_watchlist', JSON.stringify(newWatchlist));
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

    return (
        <aside className="sidebar-left">
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
                <div className="sidebar-section">
                    <div className="section-header">
                        <span className="section-title">WATCHLIST <i className="fa-solid fa-star" style={{ fontSize: '0.7rem', verticalAlign: 'middle', marginLeft: '4px' }}></i></span>
                    </div>
                    <div id="watchlist-container" className="watchlist-list">
                        {watchlist.map(sym => (
                            <div key={sym} className="w-item" onClick={() => onSelectStock && onSelectStock(sym)}>
                                <div className="w-top">
                                    <span>{sym}</span>
                                    <span style={{ color: 'var(--accent-green)', fontSize: '0.7rem' }}>LIVE <i className="fa-solid fa-circle-dot" style={{ fontSize: '0.5rem' }}></i></span>
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
                                        <span> -- </span> {/* Needs real-time price */}
                                    </div>
                                    <div className="w-bot">
                                        <span>Avg: {p.avgCost.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
}
