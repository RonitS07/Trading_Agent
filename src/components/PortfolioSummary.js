'use client';

export default function PortfolioSummary({ user }) {
    const balance = user?.balance || 0;

    // Calculate invested and P&L
    // For proper P&L, we need current prices.
    // This component might need to subscribe to price updates or receive them.
    // For now, we display Cost Basis or Static, but "Charts & Analytics" requirement says "P&L".
    // We'll calculate Invested (Cost Basis) for now.

    const invested = user?.portfolio?.reduce((acc, p) => acc + (p.qty * p.avgCost), 0) || 0;
    const totalValue = balance + invested; // Without live price, this is static.
    // We need live prices to show real Total Value.
    // We will address this in the "data-bound" phase.

    return (
        <div className="portfolio-bar">
            <div className="stat-card">
                <span className="stat-label">CASH BALANCE</span>
                <span className="stat-value">₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="stat-card">
                <span className="stat-label">INVESTED</span>
                <span className="stat-value">₹{invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="stat-card">
                <span className="stat-label">TOTAL P&L</span>
                <span className="stat-value">+0 (0.00%)</span>
            </div>
            <div className="stat-card dropdown">
                <span className="stat-label">MARKET INFO <i className="fa-solid fa-circle-info"></i></span>
                <span className="stat-value" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                    PAPER TRADING ONLY
                </span>
            </div>
        </div>
    );
}
