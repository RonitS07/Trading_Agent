'use client';

// import { useState, useEffect } from 'react';

export default function Sidebar({ user, onSelectStock }) {
    const holdings = user?.portfolio || [];

    return (
        <aside className="sidebar-left">
            <div className="search-container">
                <div className="search-input-wrapper">
                    <i className="fa-solid fa-magnifying-glass search-icon"></i>
                    <input type="text" id="omnibar-input" placeholder="Search Stocks..." autoComplete="off" />
                    <div id="search-results" className="search-dropdown hidden"></div>
                </div>
            </div>

            <div className="sidebar-content">
                <div className="sidebar-section">
                    <div className="section-header">
                        <span className="section-title">WATCHLIST <i className="fa-solid fa-star" style={{ fontSize: '0.7rem', verticalAlign: 'middle', marginLeft: '4px' }}></i></span>
                    </div>
                    <div id="watchlist-container" className="watchlist-list">
                        {/* Watchlist items (Local Storage impl later) */}
                        <div className="placeholder-text">Loading...</div>
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
