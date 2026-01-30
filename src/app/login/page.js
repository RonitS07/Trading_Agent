'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './login.module.css';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [showWelcome, setShowWelcome] = useState(false);
    const [form, setForm] = useState({ email: '', password: '', name: '' });

    useEffect(() => {
        if (searchParams.get('error')) {
            setError(searchParams.get('error'));
        }
        if (searchParams.get('message')) {
            setSuccessMsg(searchParams.get('message'));
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            if (isLogin) {
                const res = await signIn('credentials', {
                    redirect: false,
                    email: form.email,
                    password: form.password
                });

                if (res?.error) throw new Error("Invalid credentials");
                setSuccessMsg("ACCESS GRANTED. INITIALIZING...");
                setTimeout(() => {
                    router.push('/');
                    router.refresh();
                }, 800);
            } else {
                // Email regex validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(form.email)) {
                    throw new Error("Invalid email format. Please use a valid email address.");
                }

                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Registration failed");

                // Auto login after register
                await signIn('credentials', {
                    redirect: false,
                    email: form.email,
                    password: form.password
                });

                // Show Welcome Mission Briefing instead of direct redirect
                setShowWelcome(true);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEnterTerminal = () => {
        router.push('/');
        router.refresh();
    };

    return (
        <div className={styles.container}>
            {showWelcome && (
                <div className={styles.welcomeOverlay}>
                    <div className={styles.welcomeCard}>
                        <div className={styles.missionHeader}>MISSION BRIEFING</div>
                        <div className={styles.avatarBig}>{form.name?.[0] || 'A'}</div>
                        <h2>{form.name}</h2>
                        <p>Identity established successfully.</p>
                        <div className={styles.briefBox}>
                            <div className={styles.briefLabel}>INITIAL ALLOCATION</div>
                            <div className={styles.briefValue}>₹1,00,000.00</div>
                            <div className={styles.briefSub}>VIRTUAL CAPITAL</div>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '15px' }}>
                            Your objective is to maximize portfolio value through strategic equity trading.
                        </p>
                        <button className={styles.btnLaunch} onClick={handleEnterTerminal}>
                            ENTER TERMINAL
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.loginCard}>
                <div className={styles.logoBox}>
                    <i className="fa-solid fa-bolt"></i>
                </div>
                <span className={styles.brandName}>
                    TRADE<span style={{ color: '#06b6d4' }}>PILOT</span>
                </span>
                <div className={styles.brandSubtitle}>
                    {isLogin ? 'Secure Terminal Access' : 'New Identity Creation'}
                </div>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className={styles.inputGroup}>
                            <label>Designation (Name)</label>
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                    )}
                    <div className={styles.inputGroup}>
                        <label>Access ID (Email)</label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Passkey</label>
                        <input
                            type="password"
                            required
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                        />
                    </div>
                    <button type="submit" className={styles.btnLogin} disabled={loading}>
                        {loading ? 'SYNCING...' : (isLogin ? 'INITIALIZE IDENTITY' : 'ESTABLISH LINK')}
                    </button>
                </form>

                {error && <div className={styles.errorMsg}>{error}</div>}
                {successMsg && <div className={styles.successMsg}>{successMsg}</div>}

                <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#94a3b8', cursor: 'pointer' }}
                    onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }}>
                    {isLogin ? "New user? Create account" : "Already have ID? Login"}
                </p>

                <footer style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#64748b' }}>
                    TradePilot &copy; 2026<br />Restricted Access System
                </footer>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className={styles.container}>Loading Interface...</div>}>
            <LoginForm />
        </Suspense>
    );
}
