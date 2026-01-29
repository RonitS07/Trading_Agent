'use client';

import { usePortfolioContext } from '@/components/Providers';

export default function PortfolioSummary({ user }) {
    const {
        invested,
        netWorth,
        totalPL,
        totalPLPct,
        balance
    } = usePortfolioContext();

    return (
        <div className="portfolio-bar">
            <div className="stat-card">
                <span className="stat-label">CASH BALANCE</span>
                <span className="stat-value">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="stat-card">
                <span className="stat-label">INVESTED</span>
                <span className="stat-value">₹{invested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="stat-card">
                <span className="stat-label">TOTAL P&L</span>
                <span className="stat-value" style={{ color: totalPL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {totalPL >= 0 ? '+' : ''}₹{totalPL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({totalPLPct.toFixed(2)}%)
                </span>
            </div>
            <div className="stat-card dropdown">
                <span className="stat-label">MARKET INFO <i className="fa-solid fa-circle-info"></i></span>
                <span className="stat-value" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                    BSE/NSE LIVE
                </span>
            </div>
        </div>
    );
}
