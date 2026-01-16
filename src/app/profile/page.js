'use client';

export const dynamic = 'force-dynamic';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function ProfilePage() {
    const { data: session } = useSession({ required: true });
    const router = useRouter();

    if (!session) return <div>Loading...</div>;

    return (
        <div className="pro-theme">
            <Header user={session.user} activeTab="profile" setActiveTab={() => router.push('/')} />

            <div className="main-layout" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
                <div className="card profile-card-v2" style={{ maxWidth: '450px', width: '100%', padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                    <div className="profile-banner" style={{ height: '80px', background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))', position: 'relative' }}>
                        <div className="user-avatar" style={{
                            width: '90px',
                            height: '90px',
                            fontSize: '2.5rem',
                            position: 'absolute',
                            bottom: '-45px',
                            left: '25px',
                            border: '4px solid #0f172a',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                            background: 'var(--bg-sidebar)'
                        }}>
                            {session.user.name?.[0] || 'U'}
                        </div>
                    </div>

                    <div style={{ padding: '60px 25px 25px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>{session.user.name}</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{session.user.email}</p>
                            </div>
                            <div className="badge-pro" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '800', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                                PRO ACCOUNT
                            </div>
                        </div>

                        <div className="profile-details-grid" style={{ marginTop: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="p-detail-item" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Trading Experience</span>
                                <div style={{ fontWeight: '600', marginTop: '4px', fontSize: '0.9rem' }}>Advanced</div>
                            </div>
                            <div className="p-detail-item" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Region</span>
                                <div style={{ fontWeight: '600', marginTop: '4px', fontSize: '0.9rem' }}>India (NSE/BSE)</div>
                            </div>
                        </div>

                        <div className="trading-stats-section" style={{ marginTop: '30px' }}>
                            <h3 style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1px', color: 'var(--accent-cyan)', marginBottom: '15px' }}>TRADING STATISTICS</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                <div style={{ textAlign: 'center', background: 'rgba(34, 197, 94, 0.05)', padding: '15px 10px', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-green)' }}>84%</div>
                                    <div style={{ fontSize: '0.55rem', opacity: 0.6, fontWeight: '700' }}>WIN RATE</div>
                                </div>
                                <div style={{ textAlign: 'center', background: 'rgba(6, 182, 212, 0.05)', padding: '15px 10px', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.1)' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>128</div>
                                    <div style={{ fontSize: '0.55rem', opacity: 0.6, fontWeight: '700' }}>TRADES</div>
                                </div>
                                <div style={{ textAlign: 'center', background: 'rgba(255, 0, 255, 0.05)', padding: '15px 10px', borderRadius: '12px', border: '1px solid rgba(255, 0, 255, 0.1)' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-magenta)' }}>A+</div>
                                    <div style={{ fontSize: '0.55rem', opacity: 0.6, fontWeight: '700' }}>HEALTH</div>
                                </div>
                            </div>
                        </div>

                        <div className="profile-actions" style={{ marginTop: '35px', display: 'flex', gap: '10px' }}>
                            <button
                                className="btn-action-ghost"
                                style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}
                                onClick={() => router.push('/')}
                            >
                                Terminal View
                            </button>
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                style={{
                                    padding: '12px 20px',
                                    background: 'transparent',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    borderRadius: '8px',
                                    color: '#ef4444',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontWeight: '600'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.05)'}
                                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
