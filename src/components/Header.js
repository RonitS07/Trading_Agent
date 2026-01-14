'use client';

import { signOut } from 'next-auth/react';

export default function Header({ user, activeTab, setActiveTab }) {
    return (
        <header className="top-header">
            <div className="header-content">
                <div className="brand">
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
                </nav>

                <div className="header-actions">
                    <div id="market-status-badge" className="market-tag">NSE/BSE LIVE</div>
                    <div className="user-avatar" onClick={() => signOut()} title="Logout">
                        {user?.name?.[0] || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
}
