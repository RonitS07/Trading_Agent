'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ email: '', password: '', name: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                const res = await signIn('credentials', {
                    redirect: false,
                    email: form.email,
                    password: form.password
                });

                if (res?.error) throw new Error("Invalid credentials");
                router.push('/');
                router.refresh();
            } else {
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
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                <div className={styles.logoBox}>
                    <i className="fa-solid fa-bolt"></i>
                </div>
                <span className={styles.brandName}>
                    TRADE<span style={{ color: '#06b6d4' }}>PILOT</span>
                </span>
                <div className={styles.brandSubtitle}>
                    {isLogin ? 'Access Terminal' : 'Create Account'}
                </div>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className={styles.inputGroup}>
                            <label>Full Name</label>
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                    )}
                    <div className={styles.inputGroup}>
                        <label>Email Access ID</label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Security PIN / Password</label>
                        <input
                            type="password"
                            required
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                        />
                    </div>
                    <button type="submit" className={styles.btnLogin} disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'INITIALIZE TERMINAL' : 'CREATE ACCOUNT')}
                    </button>
                </form>

                {error && <div className={styles.errorMsg}>{error}</div>}

                <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#94a3b8', cursor: 'pointer' }}
                    onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? "New user? Create account" : "Already have ID? Login"}
                </p>

                <footer style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#64748b' }}>
                    TradePilot &copy; 2026<br />Restricted Access System
                </footer>
            </div>
        </div>
    );
}
