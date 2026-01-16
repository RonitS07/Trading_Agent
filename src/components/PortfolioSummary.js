'use client';

import { useState, useEffect } from 'react';

export default function PortfolioSummary({ user }) {
    const [valuation, setValuation] = useState(0);
    const balance = user?.balance || 0;
    const holdings = user?.portfolio || [];

    useEffect(() => {
        if (holdings.length === 0) {
            setValuation(0);
            return;
        }

        const fetchValuation = async () => {
            try {
                const symbols = holdings.map(h => h.symbol).join(',');
                const res = await fetch(`/api/quote?symbol=${symbols}`);
                const data = await res.json();

                let totalVal = 0;
                if (Array.isArray(data)) {
                    data.forEach(q => {
                        const h = holdings.find(item => item.symbol === q.symbol);
                        totalVal += h ? h.qty * q.price : 0;
                    });
                } else {
                    const h = holdings.find(item => item.symbol === data.symbol);
                    totalVal = h ? h.qty * data.price : 0;
                }
                setValuation(totalVal);
            } catch (e) {
                // console.error("Valuation fetch error:", e);
            }
        };

        fetchValuation();
        const interval = setInterval(fetchValuation, 30000);
        return () => clearInterval(interval);
    }, [holdings]);

    const invested = holdings.reduce((acc, p) => acc + (p.qty * p.avgCost), 0);
    const initialCapital = 100000;
    const netWorth = balance + valuation;
    const totalPnL = netWorth - initialCapital;
    const pnlPct = (totalPnL / initialCapital) * 100;

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
                <span className="stat-value" style={{ color: totalPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({pnlPct.toFixed(2)}%)
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
