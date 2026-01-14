'use client';

import { useState } from 'react';

export default function TradePanel({ symbol, userId, onTradeComplete }) {
    const [qty, setQty] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleTrade = async (action) => {
        setLoading(true);
        setMessage('');
        try {
            const res = await fetch('/api/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, symbol, action, qty: parseInt(qty) })
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

    return (
        <div className="trade-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginTop: '1rem' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label>Qty:</label>
                <input
                    type="number"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    min="1"
                    style={{ background: '#1e293b', border: '1px solid #475569', color: 'white', padding: '0.5rem', borderRadius: '6px', width: '80px' }}
                />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    onClick={() => handleTrade('BUY')}
                    disabled={loading}
                    className="btn-buy-primary"
                    style={{ flex: 1, padding: '0.8rem', background: 'var(--success)', border: 'none', borderRadius: '8px', color: 'black', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                    BUY
                </button>
                <button
                    onClick={() => handleTrade('SELL')}
                    disabled={loading}
                    className="btn-sell-primary"
                    style={{ flex: 1, padding: '0.8rem', background: 'var(--danger)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                    SELL
                </button>
            </div>
            {message && <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: message.startsWith('Error') ? 'var(--danger)' : 'var(--success)' }}>{message}</div>}
        </div>
    );
}
