'use client';

import { useRouter } from 'next/navigation';

export default function Header({ user, activeTab, setActiveTab, marketStatus, toggleSidebar }) {
    const router = useRouter();
    return (
        <header className="top-header">
            <div className="header-content">
                <div className="brand">
                    <button
                        className="mobile-menu-btn"
                        onClick={toggleSidebar}
                        style={{ background: 'transparent', border: 'none', color: 'white', marginRight: '10px', fontSize: '1.2rem' }}
                    >
                        <i className="fa-solid fa-bars"></i>
                    </button>
                    <div className="logo-box" style={{ background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))' }}>
                        <i className="fa-solid fa-bolt"></i>
                    </div>
                    <span className="brand-name">TRADE<span className="accent-text" style={{ color: 'var(--accent-cyan)' }}>PILOT</span></span>
                </div>

                <nav className="main-nav">
                    <button className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        <i className="fa-solid fa-house"></i> Overview
                    </button>
                    <button className={`nav-btn ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>
                        <i className="fa-solid fa-magnifying-glass"></i> Analysis
                    </button>
                    <button className={`nav-btn ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => setActiveTab('planner')}>
                        <i className="fa-solid fa-brain"></i> AI Planner
                    </button>

                    <button className="nav-btn" onClick={() => router.push('/profile')} id="nav-profile">
                        <i className="fa-solid fa-user-astronaut"></i> {user?.name || 'PROFILE'}
                    </button>
                </nav>

                <div className="header-actions">
                    {marketStatus && !marketStatus.open ? (
                        <div id="market-status-badge" className="market-tag closed" style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#f87171' }}>MARKET CLOSED</div>
                    ) : (
                        <div id="market-status-badge" className="market-tag">NSE/BSE LIVE</div>
                    )}
                </div>
            </div>
        </header>
    );
}

