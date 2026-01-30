'use client';

import { useState, useEffect } from 'react';

export default function MobileOnboarding({ onComplete }) {
    const [step, setStep] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Fade in animation
        setTimeout(() => setVisible(true), 100);
    }, []);

    const handleStart = () => {
        setVisible(false);
        setTimeout(() => {
            onComplete();
        }, 500); // 500ms fade out
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: '100dvh', // Use dynamic viewport height
            zIndex: 9999, // Topmost
            background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 25px',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.5s ease',
            pointerEvents: visible ? 'auto' : 'none',
            overflow: 'hidden', // Strictly disable scrolling
            touchAction: 'none' // Disable touch scrolling
        }}>
            {/* Background Glows */}
            <div style={{
                position: 'absolute',
                top: '20%',
                left: '10%',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(0,0,0,0) 70%)',
                filter: 'blur(40px)',
                animation: 'pulse 4s infinite ease-in-out'
            }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', width: '100%', maxWidth: '360px' }}>
                <h1 style={{
                    fontSize: '2.2rem',
                    fontWeight: '800',
                    marginBottom: '10px',
                    background: 'linear-gradient(to right, #fff, #94a3b8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.2
                }}>
                    Welcome to<br />TradePilot
                </h1>

                <p style={{
                    color: '#94a3b8',
                    fontSize: '0.95rem',
                    marginBottom: '30px',
                    lineHeight: 1.5
                }}>
                    Your AI-powered trading companion.
                </p>

                {/* Navigation Guide - The "Understanding Part" */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '20px',
                    padding: '20px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    marginBottom: '30px',
                    backdropFilter: 'blur(10px)'
                }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Quick Guide</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', background: 'rgba(6,182,212,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fa-solid fa-house" style={{ color: '#06b6d4', fontSize: '0.8rem' }}></i>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Dashboard</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', background: 'rgba(6,182,212,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fa-solid fa-chart-line" style={{ color: '#06b6d4', fontSize: '0.8rem' }}></i>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Charts</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', background: 'rgba(6,182,212,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fa-solid fa-robot" style={{ color: '#06b6d4', fontSize: '0.8rem' }}></i>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>AI Strategy</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', background: 'rgba(6,182,212,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fa-solid fa-briefcase" style={{ color: '#06b6d4', fontSize: '0.8rem' }}></i>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Portfolio</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleStart}
                    style={{
                        width: '100%',
                        padding: '16px',
                        background: 'linear-gradient(90deg, var(--accent-cyan), #0891b2)',
                        border: 'none',
                        borderRadius: '16px',
                        color: 'white',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(6,182,212,0.4)',
                        transition: 'transform 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        marginTop: '10px'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Start Trading <i className="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>
    );
}
