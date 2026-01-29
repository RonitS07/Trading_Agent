'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function ProfilePage() {
    const { data: session } = useSession({ required: true });
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(window.innerWidth <= 768);
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (session?.user?.id) {
            fetch(`/api/user?userId=${session.user.id}`)
                .then(res => res.json())
                .then(data => setStats(data))
                .catch(err => console.error(err));
        }
    }, [session]);

    // Experience Logic
    const totalTrades = stats?.totalTrades || 0;
    let level = 'BEGINNER';
    let progress = 10;
    if (totalTrades > 5) { level = 'INTERMEDIATE'; progress = 40; }
    if (totalTrades > 25) { level = 'ADVANCED'; progress = 75; }
    if (totalTrades > 100) { level = 'PRO'; progress = 100; }

    if (!session) return <div>Loading...</div>;

    return (
        <div className="pro-theme">

            {!isMobile && <Header user={session.user} activeTab="profile" setActiveTab={(t) => router.push(`/?tab=${t}`)} />}

            {isMobile && (
                <div style={{ padding: '15px', display: 'flex', alignItems: 'center' }}>
                    <button onClick={() => router.push('/')} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-arrow-left"></i> Back
                    </button>
                </div>
            )}

            <div className="main-layout" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem', background: 'radial-gradient(circle at center, rgba(0, 85, 255, 0.05) 0%, transparent 70%)' }}>
                <div className="card profile-card-v2" style={{ maxWidth: '500px', width: '100%', padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'rgba(13, 18, 28, 0.85)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>

                    {/* Animated Banner */}
                    <div className="profile-banner" style={{ height: '120px', background: 'linear-gradient(45deg, #0f172a, #1e293b)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', transform: 'skewX(-20deg)', width: '50%', left: '-50%', animation: 'shine 3s infinite linear' }}></div>
                        <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: '5px' }}>
                            <span style={{ fontSize: '0.6rem', color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>PRO</span>
                            <span style={{ fontSize: '0.6rem', color: 'var(--accent-green)', background: 'rgba(34, 197, 94, 0.1)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>VERIFIED</span>
                        </div>
                    </div>

                    <div style={{ padding: '0 30px 30px', marginTop: '-50px', position: 'relative' }}>
                        <div className="user-avatar" style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '20px',
                            fontSize: '2.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '4px solid var(--bg-card)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            background: 'linear-gradient(135deg, var(--accent-blue), #60a5fa)',
                            color: '#fff',
                            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                            marginBottom: '15px'
                        }}>
                            {session.user.name?.[0] || 'U'}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '25px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.5px', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{session.user.name}</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <i className="fa-regular fa-envelope"></i> {session.user.email}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600' }}>JOINED</div>
                                <div style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>Jan 2026</div>
                            </div>
                        </div>

                        {/* Experience Bar */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '25px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', fontWeight: '700' }}>
                                <span style={{ color: 'var(--accent-cyan)' }}>EXPERIENCE LEVEL</span>
                                <span>{level}</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))', boxShadow: '0 0 10px var(--accent-cyan)', transition: 'width 1s ease' }}></div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                                <span style={{ fontSize: '0.65rem', background: '#000', padding: '4px 8px', borderRadius: '4px', color: '#94a3b8', border: '1px solid #334155' }}>OPTIONS TRADING</span>
                                <span style={{ fontSize: '0.65rem', background: '#000', padding: '4px 8px', borderRadius: '4px', color: '#94a3b8', border: '1px solid #334155' }}>NSE/BSE</span>
                            </div>
                        </div>

                        <div className="trading-stats-section">
                            <h3 style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1px', color: 'var(--accent-cyan)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-chart-simple"></i> PERFORMANCE
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                <div style={{ textAlign: 'center', background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.05), transparent)', padding: '20px 10px', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-green)', textShadow: '0 0 20px rgba(34, 197, 94, 0.4)' }}>{stats?.winRate || 0}%</div>
                                    <div style={{ fontSize: '0.6rem', opacity: 0.7, fontWeight: '700', marginTop: '4px' }}>WIN RATE</div>
                                </div>
                                <div style={{ textAlign: 'center', background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.05), transparent)', padding: '20px 10px', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-cyan)', textShadow: '0 0 20px rgba(6, 182, 212, 0.4)' }}>{stats?.totalTrades || 0}</div>
                                    <div style={{ fontSize: '0.6rem', opacity: 0.7, fontWeight: '700', marginTop: '4px' }}>TRADES</div>
                                </div>
                                <div style={{ textAlign: 'center', background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.05), transparent)', padding: '20px 10px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-magenta)', textShadow: '0 0 20px rgba(255, 0, 255, 0.4)' }}>{stats?.health || 'A+'}</div>
                                    <div style={{ fontSize: '0.6rem', opacity: 0.7, fontWeight: '700', marginTop: '4px' }}>HEALTH</div>
                                </div>
                            </div>
                        </div>

                        <div className="profile-actions" style={{ marginTop: '35px', display: 'flex', gap: '15px' }}>
                            <button
                                style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '700', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                onClick={() => router.push('/')}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.borderColor = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                }}
                            >
                                <i className="fa-solid fa-terminal"></i> Terminal View
                            </button>
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                style={{
                                    padding: '14px 24px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '8px',
                                    color: '#f87171',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--accent-red)';
                                    e.currentTarget.style.color = '#fff';
                                    e.currentTarget.style.boxShadow = '0 0 15px var(--accent-red)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                    e.currentTarget.style.color = '#f87171';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <i className="fa-solid fa-power-off"></i> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                @keyframes shine {
                    0% { left: -100%; opacity: 0; }
                    50% { opacity: 0.5; }
                    100% { left: 200%; opacity: 0; }
                }
            `}</style>
        </div>
    );
}
