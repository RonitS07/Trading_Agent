'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TradePanel({ symbol, user, onTradeComplete }) {
    const router = useRouter();
    const [qty, setQty] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleTrade = async (action) => {
        if (!user) {
            setMessage('Please login to trade');
            return;
        }

        setLoading(true);
        setMessage('');
        try {
            const res = await fetch('/api/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, symbol, action, qty: parseInt(qty) })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage(`Success: ${action} ${qty} ${symbol}`);
            if (onTradeComplete) onTradeComplete(data);
        } catch (e) {
            setMessage(`Error: ${e.message}`);
        } finally {
            setLoading(false);
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
        <div className="trade-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', marginTop: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', opacity: 0.7 }}>QUANTITY</label>
                <input
                    type="number"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    min="1"
                    className="trade-input"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '8px', width: '100px', outline: 'none' }}
                />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    onClick={() => handleTrade('BUY')}
                    disabled={loading}
                    className="btn-futuristic btn-buy"
                    style={{
                        flex: 1,
                        padding: '1rem',
                        background: '#00ff9d',
                        boxShadow: '0 0 25px rgba(0, 255, 157, 0.4), 0 0 50px rgba(0, 255, 157, 0.2)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#000',
                        fontWeight: '800',
                        cursor: 'pointer',
                        opacity: loading ? 0.7 : 1,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        letterSpacing: '1px',
                        textShadow: '0 0 10px rgba(0,0,0,0.2)'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.02) translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1) translateY(0)'}
                >
                    BUY
                </button>
                <button
                    onClick={() => handleTrade('SELL')}
                    disabled={loading}
                    className="btn-futuristic btn-sell"
                    style={{
                        flex: 1,
                        padding: '1rem',
                        background: '#ff0055',
                        boxShadow: '0 0 25px rgba(255, 0, 85, 0.4), 0 0 50px rgba(255, 0, 85, 0.2)',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        fontWeight: '800',
                        cursor: 'pointer',
                        opacity: loading ? 0.7 : 1,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        letterSpacing: '1px',
                        textShadow: '0 0 10px rgba(0,0,0,0.2)'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.02) translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1) translateY(0)'}
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
