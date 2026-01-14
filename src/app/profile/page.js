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

            <div className="main-layout" style={{ justifyContent: 'center', paddingTop: '5rem' }}>
                <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
                    <div className="profile-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div className="user-avatar" style={{ width: '80px', height: '80px', fontSize: '2rem', margin: '0 auto 1rem' }}>
                            {session.user.name?.[0] || 'U'}
                        </div>
                        <h2>{session.user.name}</h2>
                        <p style={{ color: '#94a3b8' }}>{session.user.email}</p>
                    </div>

                    <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1.5rem' }}>
                        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Account Type</span>
                            <span className="accent-text">Paper Trader PRO</span>
                        </div>
                        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Status</span>
                            <span style={{ color: 'var(--success)' }}>Active</span>
                        </div>

                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="btn-sell-primary"
                            style={{ width: '100%', padding: '1rem', background: '#ef4444', color: 'white' }}
                        >
                            LOGOUT FROM TERMINAL
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
