import { useRouter } from 'next/navigation';

export default function Header({ user, activeTab, setActiveTab }) {
    const router = useRouter();
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
                    <button className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => router.push('/profile')}>
                        <i className="fa-solid fa-user-gear"></i> Profile
                    </button>
                </nav>

                <div className="header-actions">
                    <div id="market-status-badge" className="market-tag">NSE/BSE LIVE</div>
                    <div
                        className="user-avatar"
                        onClick={() => router.push('/profile')}
                        title="View Profile"
                        style={{
                            border: '2px solid var(--accent-cyan)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(6, 182, 212, 0.1)',
                            fontWeight: '600',
                            marginLeft: '15px'
                        }}
                    >
                        {user?.name?.[0] || <i className="fa-solid fa-user"></i>}
                    </div>
                </div>
            </div>
        </header>
    );
}

