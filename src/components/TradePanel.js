'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TradePanel({ symbol, user, onTradeComplete }) {
    const router = useRouter();
    const [qty, setQty] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [password, setPassword] = useState('');
    const [confirmingAction, setConfirmingAction] = useState(null);
    const [tradeStatus, setTradeStatus] = useState('idle'); // idle, loading, success, error
    const [statusMessage, setStatusMessage] = useState('');

    const onActionClick = (action) => {
        setTradeStatus('idle');
        setStatusMessage('');
        setPassword('');
        setConfirmingAction(action);
    };

    const handleTrade = async () => {
        if (!user || !confirmingAction) return;

        if (!password) {
            setTradeStatus('error');
            setStatusMessage('Password is required');
            return;
        }

        setTradeStatus('loading');
        setStatusMessage('');
        const action = confirmingAction;

        try {
            const res = await fetch('/api/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, symbol, action, qty: parseInt(qty), password })
            });
            const data = await res.json();

            if (!res.ok) {
                setTradeStatus('error');
                setStatusMessage(data.error || 'Trade failed');
                throw new Error(data.error);
            }

            // Success
            setTradeStatus('success');
            setStatusMessage(`Successfully ${action === 'BUY' ? 'BOUGHT' : 'SOLD'} ${qty} ${symbol}`);
            if (onTradeComplete) onTradeComplete(data);

            // Close after delay
            setTimeout(() => {
                setConfirmingAction(null);
                setPassword('');
                setMessage(`Last Trade: ${action} ${qty} ${symbol}`);
            }, 1500);

        } catch (e) {
            // console.error(e);
            // Error status already set above for API errors
            if (tradeStatus !== 'error') {
                setTradeStatus('error');
                setStatusMessage(e.message);
            }
        }
    };

    if (!user) {
        return (
            <div className="trade-panel auth-gate" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginTop: '1rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <p style={{ marginBottom: '1rem', opacity: 0.8 }}>Authentication required for trading</p>
                <button
                    onClick={() => router.push('/login')}
                    className="btn-auth"
                    style={{ padding: '0.8rem 1.5rem', background: 'var(--accent-cyan)', border: 'none', borderRadius: '8px', color: 'black', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    Login to Paper Trade
                </button>
            </div>
        );
    }

    return (
        <div className="trade-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', marginTop: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
            {/* FULL SCREEN BLUR OVERLAY */}
            {confirmingAction && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'fadeIn 0.2s ease'
                }}>
                    <div style={{
                        background: '#0a0a0a',
                        padding: '2.5rem',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        width: '90%',
                        maxWidth: '360px',
                        textAlign: 'center',
                        boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.7)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Status UI Switcher */}
                        {tradeStatus === 'success' ? (
                            <div className="status-success" style={{ padding: '20px 0' }}>
                                <div style={{
                                    width: '80px', height: '80px', borderRadius: '50%', background: '#22c55e',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                                    boxShadow: '0 0 30px rgba(34, 197, 94, 0.5)'
                                }}>
                                    <i className="fa-solid fa-check" style={{ fontSize: '2.5rem', color: 'black' }}></i>
                                </div>
                                <h3 style={{ color: '#22c55e', marginBottom: '10px' }}>TRADE EXECUTED</h3>
                                <p style={{ opacity: 0.7 }}>{statusMessage}</p>
                            </div>
                        ) : (
                            <>
                                <i className={`fa-solid ${confirmingAction === 'BUY' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}
                                    style={{
                                        fontSize: '3rem',
                                        color: confirmingAction === 'BUY' ? '#22c55e' : '#ef4444',
                                        marginBottom: '20px',
                                        textShadow: confirmingAction === 'BUY' ? '0 0 20px rgba(34, 197, 94, 0.5)' : '0 0 20px rgba(239, 68, 68, 0.5)'
                                    }}></i>

                                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', letterSpacing: '1px' }}>CONFIRM {confirmingAction}</h3>
                                <p style={{ margin: '0 0 25px 0', fontSize: '0.9rem', opacity: 0.5 }}>Enter login password to authorize</p>

                                <input
                                    type="password"
                                    placeholder="Password"
                                    autoFocus
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setTradeStatus('idle'); }}
                                    className="trade-input"
                                    disabled={tradeStatus === 'loading'}
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: tradeStatus === 'error' ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                                        color: 'white',
                                        padding: '1.2rem',
                                        borderRadius: '12px',
                                        outline: 'none',
                                        width: '100%',
                                        textAlign: 'center',
                                        fontSize: '1.2rem',
                                        marginBottom: '10px',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                                {tradeStatus === 'error' && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '20px' }}>{statusMessage}</div>}

                                <div style={{ display: 'flex', gap: '15px', width: '100%', marginTop: '20px' }}>
                                    <button
                                        onClick={() => setConfirmingAction(null)}
                                        disabled={tradeStatus === 'loading'}
                                        style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        onClick={handleTrade}
                                        disabled={tradeStatus === 'loading' || !password}
                                        style={{
                                            flex: 1.5,
                                            padding: '1rem',
                                            background: confirmingAction === 'BUY' ? '#064e3b' : '#450a0a',
                                            border: `1px solid ${confirmingAction === 'BUY' ? '#22c55e' : '#ef4444'}`,
                                            color: confirmingAction === 'BUY' ? '#4ade80' : '#f87171',
                                            borderRadius: '12px',
                                            cursor: (tradeStatus === 'loading' || !password) ? 'not-allowed' : 'pointer',
                                            fontWeight: '800',
                                            opacity: (tradeStatus === 'loading' || !password) ? 0.5 : 1,
                                            boxShadow: confirmingAction === 'BUY' ? '0 0 20px rgba(34, 197, 94, 0.2)' : '0 0 20px rgba(239, 68, 68, 0.2)',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {tradeStatus === 'loading' ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'CONFIRM'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: '700', opacity: 0.6, letterSpacing: '1px' }}>QUANTITY</label>
                <input
                    type="number"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    min="1"
                    className="trade-input"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.8rem', borderRadius: '8px', outline: 'none', width: '100%' }}
                />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    onClick={() => onActionClick('BUY')}
                    disabled={loading}
                    className="btn-futuristic btn-buy"
                    style={{
                        flex: 1,
                        padding: '1rem',
                        background: '#022c22', // Deepest Green
                        border: '1px solid #00dc82', // Neon Green Border
                        boxShadow: '0 0 15px rgba(0, 220, 130, 0.15)',
                        borderRadius: '12px',
                        color: '#00dc82',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        letterSpacing: '1px',
                        fontSize: '1rem'
                    }}
                >
                    BUY
                </button>
                <button
                    onClick={() => onActionClick('SELL')}
                    disabled={loading}
                    className="btn-futuristic btn-sell"
                    style={{
                        flex: 1,
                        padding: '1rem',
                        background: '#2b0505', // Deepest Red
                        border: '1px solid #ff0055', // Neon Red Border
                        boxShadow: '0 0 15px rgba(255, 0, 85, 0.15)',
                        borderRadius: '12px',
                        color: '#ff0055',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        letterSpacing: '1px',
                        fontSize: '1rem'
                    }}
                >
                    SELL
                </button>
            </div>
            {message && (
                <div style={{
                    marginTop: '1rem',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    padding: '8px',
                    borderRadius: '6px',
                    background: message.startsWith('Error') ? 'rgba(255, 0, 85, 0.1)' : 'rgba(0, 255, 157, 0.1)',
                    color: message.startsWith('Error') ? '#ff0055' : '#00ff9d',
                    fontWeight: '600'
                }}>
                    {message}
                </div>
            )}
        </div>
    );
}
