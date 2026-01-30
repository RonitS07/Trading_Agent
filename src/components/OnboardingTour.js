'use client';

import { useState, useEffect } from 'react';

const STEPS = [
    {
        target: 'body',
        title: 'WELCOME', // Will be appended with Name dynamically
        content: 'Initialize your journey with <strong>TradePilot</strong>. Your advanced, Artificially Intelligent terminal is ready for deployment.',
        position: 'center',
        action: 'INITIALIZE'
    },
    {
        target: '.sidebar-left',
        title: 'MARKET SURVEILLANCE',
        content: 'This represents your eyes on the market. \n\n<span style="color:var(--accent-cyan)">●</span> <strong>Watchlist</strong>: Track high-priority assets.\n<span style="color:var(--accent-cyan)">●</span> <strong>Holdings</strong>: Monitor P&L in real-time.',
        position: 'right',
        action: 'NEXT SECTOR'
    },
    {
        target: '.main-nav',
        title: 'NAVIGATION DECK',
        content: 'Switch tactical views effortlessly.\n\n<strong>Overview</strong>: Bird\'s eye view.\n<strong>Analysis</strong>: Deep technical charts.\n<strong>AI Planner</strong>: Your strategy engine.',
        position: 'bottom',
        action: 'PROCEED'
    },
    {
        target: '#tab-container',
        title: 'EXECUTION FIELD',
        content: 'The core workspace. Analyze charts with <span style="color:#f59e0b">SMA/RSI</span> indicators and execute lightning-fast Limit/Market orders.',
        position: 'center',
        action: 'ADVANCE'
    },
    {
        target: '#nav-profile',
        title: 'IDENTITY & CONFIG',
        content: 'Manage your operative profile. Logout or tweak system preferences from this secure node.',
        position: 'left',
        action: 'LAUNCH TERMINAL'
    }
];

export default function OnboardingTour({ onComplete, user }) {
    const [stepIndex, setStepIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [rect, setRect] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (!user) return;
        const storageKey = `tp_tour_complete_${user.id}`;
        const hasSeen = localStorage.getItem(storageKey);
        if (!hasSeen) setIsVisible(true);
    }, [user]);

    const currentStep = STEPS[stepIndex];

    useEffect(() => {
        if (!isVisible) return;

        setIsAnimating(true);
        const t = setTimeout(() => setIsAnimating(false), 500);

        const updateRect = () => {
            if (currentStep.target === 'body') {
                setRect(null);
                return;
            }
            const el = document.querySelector(currentStep.target);
            if (el) {
                const r = el.getBoundingClientRect();
                setRect({
                    top: r.top,
                    left: r.left,
                    width: r.width,
                    height: r.height
                });
            }
        };

        const t2 = setTimeout(updateRect, 100);
        window.addEventListener('resize', updateRect);

        return () => {
            clearTimeout(t);
            clearTimeout(t2);
            window.removeEventListener('resize', updateRect);
        };
    }, [stepIndex, isVisible, currentStep]);

    const handleNext = () => {
        if (stepIndex < STEPS.length - 1) {
            setStepIndex(p => p + 1);
        } else {
            handleSkip();
        }
    };

    const handleSkip = () => {
        setIsVisible(false);
        if (user) {
            localStorage.setItem(`tp_tour_complete_${user.id}`, 'true');
        }
        if (onComplete) onComplete();
    };

    if (!isVisible) return null;

    // Calculate Position styles dynamically
    const getModalStyle = () => {
        const base = {
            position: 'absolute',
            transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
            opacity: isAnimating ? 0 : 1,
            transform: isAnimating ? 'translate(-50%, -45%) scale(0.95)' : 'translate(-50%, -50%) scale(1)'
        };

        if (!rect) return { ...base, top: '50%', left: '50%' };

        let top, left, transform;
        const gap = 40;

        if (currentStep.position === 'center') {
            top = rect.top + (rect.height / 2);
            left = rect.left + (rect.width / 2);
            transform = isAnimating ? 'translate(-50%, -45%) scale(0.95)' : 'translate(-50%, -50%) scale(1)';
        } else if (currentStep.position === 'bottom') {
            top = rect.top + rect.height + gap;
            left = rect.left + (rect.width / 2);
            transform = isAnimating ? 'translate(-50%, 10px)' : 'translate(-50%, 0)';
        } else if (currentStep.position === 'right') {
            top = rect.top + (rect.height / 2);
            left = rect.left + rect.width + gap;
            transform = isAnimating ? 'translate(10px, -50%)' : 'translate(0, -50%)';
        } else if (currentStep.position === 'left') {
            top = rect.top + (rect.height / 2);
            left = rect.left - gap - 400; // Account for width
            transform = isAnimating ? 'translate(-10px, -50%)' : 'translate(0, -50%)';
        }

        return { ...base, top, left, transform };
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 10000,
            pointerEvents: 'auto',
            overflow: 'hidden'
        }}>
            {/* AMBIENT BACKGROUND WAVE */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(5px)',
                zIndex: 1
            }}>
                <svg viewBox="0 0 1440 320" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', opacity: 0.3, filter: 'drop-shadow(0 0 20px cyan)' }}>
                    <path fill="#06b6d4" fillOpacity="0.2" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    <animate attributeName="d" du="10s" repeatCount="indefinite"
                        values="
                        M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                        M0,128L48,144C96,160,192,192,288,197.3C384,203,480,181,576,165.3C672,149,768,139,864,154.7C960,171,1056,213,1152,218.7C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                        M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    />
                </svg>
            </div>

            {/* SPOTLIGHT TARGET HIGHLIGHT */}
            {rect && (
                <div style={{
                    position: 'absolute',
                    top: rect.top - 10,
                    left: rect.left - 10,
                    width: rect.width + 20,
                    height: rect.height + 20,
                    borderRadius: '12px',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.85), 0 0 30px rgba(6,182,212,0.4)',
                    border: '2px solid rgba(6,182,212,0.6)',
                    pointerEvents: 'none',
                    zIndex: 2,
                    transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)'
                }}>
                    {/* Animated corner accents */}
                    <div style={{ position: 'absolute', top: -2, left: -2, width: 20, height: 2, background: '#fff', boxShadow: '0 0 10px cyan' }} />
                    <div style={{ position: 'absolute', top: -2, left: -2, width: 2, height: 20, background: '#fff', boxShadow: '0 0 10px cyan' }} />
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 2, background: '#fff', boxShadow: '0 0 10px cyan' }} />
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 2, height: 20, background: '#fff', boxShadow: '0 0 10px cyan' }} />
                </div>
            )}

            {/* GLASSMORPHISM CARD */}
            <div style={{
                ...getModalStyle(),
                width: '420px',
                maxWidth: '90vw',
                zIndex: 10,
                background: 'rgba(20, 20, 30, 0.65)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 80px rgba(6,182,212,0.15) inset',
                borderRadius: '24px',
                padding: '0',
                overflow: 'hidden',
                color: 'white',
                fontFamily: '"Outfit", sans-serif'
            }}>
                {/* Decorative Top Line */}
                <div style={{ height: '4px', width: '100%', background: 'linear-gradient(90deg, transparent, var(--accent-cyan), transparent)' }} />

                <div style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {STEPS.map((_, i) => (
                                <div key={i} style={{
                                    width: i === stepIndex ? '24px' : '8px',
                                    height: '4px',
                                    borderRadius: '2px',
                                    background: i === stepIndex ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.2)',
                                    transition: 'all 0.3s ease'
                                }} />
                            ))}
                        </div>
                        <i
                            className="fa-solid fa-xmark"
                            onClick={handleSkip}
                            style={{
                                cursor: 'pointer',
                                opacity: 0.5,
                                fontSize: '1.2rem',
                                transition: 'opacity 0.2s'
                            }}
                            onMouseOver={e => e.target.style.opacity = 1}
                            onMouseOut={e => e.target.style.opacity = 0.5}
                        />
                    </div>

                    <h2 style={{
                        fontSize: '1.8rem',
                        margin: '0 0 16px 0',
                        background: 'linear-gradient(to right, #fff, #94a3b8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: '800',
                        letterSpacing: '-1px'
                    }}>
                        {currentStep.target === 'body' ? `WELCOME ${user?.name || ''}`.toUpperCase() : currentStep.title}
                    </h2>

                    <div
                        style={{ fontSize: '1rem', lineHeight: '1.6', color: '#cbd5e1', marginBottom: '32px', whiteSpace: 'pre-line' }}
                        dangerouslySetInnerHTML={{ __html: currentStep.content }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                            onClick={handleSkip}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#64748b',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                letterSpacing: '0.5px'
                            }}
                        >
                            SKIP INTEL
                        </button>

                        <button
                            onClick={handleNext}
                            style={{
                                padding: '12px 32px',
                                background: 'linear-gradient(135deg, rgba(6,182,212,0.9), rgba(59,130,246,0.9))',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '0.95rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 0 20px rgba(6,182,212,0.4)',
                                transition: 'transform 0.2s',
                                letterSpacing: '1px',
                                textTransform: 'uppercase'
                            }}
                            onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
                            onMouseOut={e => e.target.style.transform = 'scale(1)'}
                        >
                            {currentStep.action}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
