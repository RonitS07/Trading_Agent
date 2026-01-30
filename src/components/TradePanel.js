'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TradePanel({ symbol, user, onTradeComplete, marketStatus }) {
    const router = useRouter();
    const [qty, setQty] = useState(1);

    // Advanced Order State
    const [orderType, setOrderType] = useState('MARKET'); // MARKET, LIMIT, SL
    const [limitPrice, setLimitPrice] = useState('');
    const [stopPrice, setStopPrice] = useState('');
    const [targetPrice, setTargetPrice] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [password, setPassword] = useState('');
    const [activeSide, setActiveSide] = useState(null); // null, 'BUY', 'SELL'
    const [confirmingAction, setConfirmingAction] = useState(null); // null, 'BUY', 'SELL'
    const [tradeStatus, setTradeStatus] = useState('idle'); // idle, loading, success, error
    const [statusMessage, setStatusMessage] = useState('');

    // Shortcut Listener
    useEffect(() => {
        const handleShortcut = (e) => {
            if (e.detail === 'BUY') setActiveSide('BUY');
            if (e.detail === 'SELL') setActiveSide('SELL');
        };
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                setConfirmingAction(null);
                setActiveSide(null);
            }
        };

        window.addEventListener('trade-shortcut', handleShortcut);
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('trade-shortcut', handleShortcut);
            window.removeEventListener('keydown', handleEsc);
        };
    }, []);

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
                body: JSON.stringify({
                    userId: user.id,
                    symbol,
                    action,
                    qty: parseInt(qty),
                    password,
                    type: orderType,
                    limitPrice: limitPrice ? parseFloat(limitPrice) : null,
                    stopPrice: stopPrice ? parseFloat(stopPrice) : null,
                    targetPrice: targetPrice ? parseFloat(targetPrice) : null
                })
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
                setActiveSide(null);
                setPassword('');
                setMessage(`Last Trade: ${action} ${qty} ${symbol}`);
            }, 1500);

        } catch (e) {
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

    // Colors based on Pic 3
    const NEON_GREEN = '#bef227';
    const NEON_PINK = '#ff0055';

    return (
        <div className="trade-panel" style={{ padding: '1.5rem', background: 'rgba(2, 6, 23, 0.4)', backdropFilter: 'blur(10px)', borderRadius: '24px', marginTop: '1.5rem', border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
            {/* FULL SCREEN BLUR OVERLAY */}
            {confirmingAction && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(15px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'fadeIn 0.2s ease'
                }}>
                    <div style={{
                        background: '#0a0a0a',
                        padding: '2.5rem',
                        borderRadius: '32px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        width: '90%',
                        maxWidth: '380px',
                        textAlign: 'center',
                        boxShadow: `0 30px 60px -12px rgba(0, 0, 0, 0.9), 0 0 40px ${confirmingAction === 'BUY' ? 'rgba(190, 242, 39, 0.1)' : 'rgba(255, 0, 85, 0.1)'}`,
                        position: 'relative'
                    }}>
                        {tradeStatus === 'success' ? (
                            <div className="status-success" style={{ padding: '20px 0' }}>
                                <div style={{
                                    width: '80px', height: '80px', borderRadius: '50%', background: NEON_GREEN,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                                    boxShadow: `0 0 30px ${NEON_GREEN}80`
                                }}>
                                    <i className="fa-solid fa-check" style={{ fontSize: '2.5rem', color: 'black' }}></i>
                                </div>
                                <h3 style={{ color: NEON_GREEN, marginBottom: '10px', fontWeight: '900' }}>TRADE EXECUTED</h3>
                                <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{statusMessage}</p>
                            </div>
                        ) : (
                            <>
                                <div style={{
                                    marginBottom: '20px',
                                    display: 'inline-flex',
                                    padding: '15px',
                                    borderRadius: '50%',
                                    background: confirmingAction === 'BUY' ? 'rgba(190, 242, 39, 0.1)' : 'rgba(255, 0, 85, 0.1)',
                                    border: `1px solid ${confirmingAction === 'BUY' ? NEON_GREEN + '30' : NEON_PINK + '30'}`
                                }}>
                                    <i className={`fa-solid ${confirmingAction === 'BUY' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}
                                        style={{ fontSize: '2.5rem', color: confirmingAction === 'BUY' ? NEON_GREEN : NEON_PINK }}></i>
                                </div>

                                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.6rem', fontWeight: '900', letterSpacing: '1px', color: '#fff' }}>CONFIRM {confirmingAction}</h3>
                                <p style={{ margin: '0 0 25px 0', fontSize: '0.85rem', opacity: 0.5, letterSpacing: '0.5px' }}>Enter password to authorize trade</p>

                                <input
                                    type="password"
                                    placeholder="Password"
                                    autoFocus
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setTradeStatus('idle'); }}
                                    className="fancy-input"
                                    disabled={tradeStatus === 'loading'}
                                    style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: tradeStatus === 'error' ? `1px solid ${NEON_PINK}` : '1px solid rgba(255,255,255,0.1)',
                                        color: 'white',
                                        padding: '1.2rem',
                                        borderRadius: '16px',
                                        outline: 'none',
                                        width: '100%',
                                        textAlign: 'center',
                                        fontSize: '1.2rem',
                                        marginBottom: '10px',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                                {tradeStatus === 'error' && <div style={{ color: NEON_PINK, fontSize: '0.75rem', marginBottom: '20px', fontWeight: '600' }}>{statusMessage}</div>}

                                <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '20px' }}>
                                    <button
                                        onClick={() => setConfirmingAction(null)}
                                        disabled={tradeStatus === 'loading'}
                                        style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', borderRadius: '16px', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem', letterSpacing: '1px' }}
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        onClick={handleTrade}
                                        disabled={tradeStatus === 'loading' || !password}
                                        style={{
                                            flex: 1.5,
                                            padding: '1rem',
                                            background: confirmingAction === 'BUY' ? 'rgba(190, 242, 39, 0.05)' : 'rgba(255, 0, 85, 0.05)',
                                            border: `1px solid ${confirmingAction === 'BUY' ? NEON_GREEN : NEON_PINK}`,
                                            color: confirmingAction === 'BUY' ? NEON_GREEN : NEON_PINK,
                                            borderRadius: '16px',
                                            cursor: (tradeStatus === 'loading' || !password) ? 'not-allowed' : 'pointer',
                                            fontWeight: '900',
                                            fontSize: '0.85rem',
                                            letterSpacing: '1px',
                                            opacity: (tradeStatus === 'loading' || !password) ? 0.3 : 1,
                                            boxShadow: confirmingAction === 'BUY' ? `0 0 20px ${NEON_GREEN}20` : `0 0 20px ${NEON_PINK}20`,
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {tradeStatus === 'loading' ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'CONFIRM ORDER'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}


            {!activeSide ? (
                /* STEP 1: INITIAL BUTTONS (Pic 1 Style) */
                <div style={{ display: 'flex', gap: '12px', animation: 'fadeIn 0.3s ease' }}>
                    <button
                        onClick={() => setActiveSide('BUY')}
                        disabled={marketStatus && !marketStatus.open}
                        style={{
                            flex: 1,
                            padding: '1.2rem',
                            background: 'rgba(190, 242, 39, 0.03)',
                            border: `1px solid ${NEON_GREEN}`,
                            borderRadius: '16px',
                            color: NEON_GREEN,
                            fontWeight: '900',
                            fontSize: '1rem',
                            letterSpacing: '2px',
                            cursor: (marketStatus && !marketStatus.open) ? 'not-allowed' : 'pointer',
                            opacity: (marketStatus && !marketStatus.open) ? 0.4 : 1,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: `inset 0 0 20px ${NEON_GREEN}10`
                        }}
                        onMouseEnter={e => { if (!marketStatus || marketStatus.open) e.currentTarget.style.background = 'rgba(190, 242, 39, 0.1)' }}
                        onMouseLeave={e => { if (!marketStatus || marketStatus.open) e.currentTarget.style.background = 'rgba(190, 242, 39, 0.03)' }}
                    >
                        BUY
                    </button>
                    <button
                        onClick={() => setActiveSide('SELL')}
                        disabled={marketStatus && !marketStatus.open}
                        style={{
                            flex: 1,
                            padding: '1.2rem',
                            background: 'rgba(255, 0, 85, 0.03)',
                            border: `1px solid ${NEON_PINK}`,
                            borderRadius: '16px',
                            color: NEON_PINK,
                            fontWeight: '900',
                            fontSize: '1rem',
                            letterSpacing: '2px',
                            cursor: (marketStatus && !marketStatus.open) ? 'not-allowed' : 'pointer',
                            opacity: (marketStatus && !marketStatus.open) ? 0.4 : 1,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: `inset 0 0 20px ${NEON_PINK}10`
                        }}
                        onMouseEnter={e => { if (!marketStatus || marketStatus.open) e.currentTarget.style.background = 'rgba(255, 0, 85, 0.1)' }}
                        onMouseLeave={e => { if (!marketStatus || marketStatus.open) e.currentTarget.style.background = 'rgba(255, 0, 85, 0.03)' }}
                    >
                        SELL
                    </button>
                </div>
            ) : (
                /* STEP 2: DETAILED FORM (Pic 2 Style) */
                <div style={{ animation: 'slideDown 0.3s ease-out' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeSide === 'BUY' ? NEON_GREEN : NEON_PINK }}></div>
                            <span style={{ fontWeight: '900', fontSize: '0.8rem', color: activeSide === 'BUY' ? NEON_GREEN : NEON_PINK, letterSpacing: '1px' }}>
                                {activeSide} ORDER
                            </span>
                        </div>
                        <button
                            onClick={() => setActiveSide(null)}
                            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '700' }}
                        >
                            <i className="fa-solid fa-arrow-left" style={{ marginRight: '5px' }}></i> BACK
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                        {['MARKET', 'LIMIT', 'SL'].map(type => (
                            <button
                                key={type}
                                onClick={() => {
                                    if (type === 'MARKET') { setLimitPrice(''); setStopPrice(''); }
                                    setOrderType(type);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '12px 0',
                                    borderRadius: '12px',
                                    border: orderType === type ? `1px solid var(--accent-cyan)` : '1px solid rgba(255,255,255,0.05)',
                                    background: orderType === type ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.02)',
                                    color: orderType === type ? 'black' : 'rgba(255,255,255,0.5)',
                                    fontSize: '0.7rem',
                                    fontWeight: '900',
                                    letterSpacing: '1px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ fontSize: '0.6rem', fontWeight: '900', opacity: 0.4, letterSpacing: '1.5px', display: 'block', marginBottom: '8px' }}>QUANTITY</label>
                            <input
                                type="number"
                                value={qty}
                                onChange={e => setQty(e.target.value)}
                                min="1"
                                className="fancy-trade-input"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '1rem', borderRadius: '16px', outline: 'none', width: '100%', fontSize: '1rem', fontWeight: '700' }}
                            />
                        </div>

                        {orderType !== 'MARKET' && (
                            <div>
                                <label style={{ fontSize: '0.6rem', fontWeight: '900', opacity: 0.4, letterSpacing: '1.5px', display: 'block', marginBottom: '8px' }}>
                                    {orderType === 'LIMIT' ? 'LIMIT PRICE' : 'TRIGGER PRICE'}
                                </label>
                                <input
                                    type="number"
                                    value={limitPrice}
                                    onChange={e => setLimitPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="fancy-trade-input"
                                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '1rem', borderRadius: '16px', outline: 'none', width: '100%', fontSize: '1rem', fontWeight: '700' }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.6rem', fontWeight: '900', opacity: 0.4, letterSpacing: '1.5px', display: 'block', marginBottom: '8px' }}>STOP LOSS (Opt)</label>
                                <input
                                    type="number"
                                    value={stopPrice}
                                    onChange={e => setStopPrice(e.target.value)}
                                    placeholder="Price"
                                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0.8rem', borderRadius: '12px', outline: 'none', width: '100%', fontSize: '0.9rem', fontWeight: '700' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.6rem', fontWeight: '900', opacity: 0.4, letterSpacing: '1.5px', display: 'block', marginBottom: '8px' }}>TARGET (Opt)</label>
                                <input
                                    type="number"
                                    value={targetPrice}
                                    onChange={e => setTargetPrice(e.target.value)}
                                    placeholder="Price"
                                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0.8rem', borderRadius: '12px', outline: 'none', width: '100%', fontSize: '0.9rem', fontWeight: '700' }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => onActionClick(activeSide)}
                            className="btn-confirm-action"
                            style={{
                                marginTop: '10px',
                                padding: '1rem',
                                background: activeSide === 'BUY' ? NEON_GREEN : NEON_PINK,
                                border: 'none',
                                borderRadius: '16px',
                                color: 'black',
                                fontWeight: '900',
                                fontSize: '0.9rem',
                                letterSpacing: '2px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: activeSide === 'BUY' ? `0 10px 20px ${NEON_GREEN}30` : `0 10px 20px ${NEON_PINK}30`
                            }}
                        >
                            REVIEW {activeSide}
                        </button>
                    </div>
                </div>
            )}

            {marketStatus && !marketStatus.open && (
                <div style={{
                    marginTop: '20px',
                    padding: '12px',
                    background: 'rgba(245, 158, 11, 0.05)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: '16px',
                    textAlign: 'center',
                    color: '#f59e0b',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    letterSpacing: '0.5px'
                }}>
                    <i className="fa-solid fa-clock" style={{ marginRight: '8px' }}></i>
                    CLOSED: {marketStatus.reason}
                </div>
            )}
        </div>
    );
}
