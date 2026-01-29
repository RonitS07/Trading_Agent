'use client';

/**
 * LoadingSkeleton Components
 * Provides elegant loading states for various UI elements
 */

export function ChartSkeleton() {
    return (
        <div className="animate-pulse" style={{ width: '100%', height: '100%' }}>
            <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.4) 25%, rgba(51, 65, 85, 0.4) 50%, rgba(30, 41, 59, 0.4) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '20px',
                gap: '8px'
            }}>
                {/* Simulated bar chart */}
                {[60, 75, 50, 85, 65, 90, 70, 55, 80, 45].map((height, i) => (
                    <div key={i} style={{
                        flex: 1,
                        height: `${height}%`,
                        background: 'rgba(6, 182, 212, 0.2)',
                        borderRadius: '4px 4px 0 0'
                    }} />
                ))}
            </div>
            <style jsx>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
        </div>
    );
}

export function WatchlistSkeleton() {
    return (
        <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => (
                <div key={i} style={{
                    background: '#1e293b',
                    borderRadius: '16px',
                    padding: '18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        <div style={{ width: '40%', height: '20px', background: 'rgba(100, 116, 139, 0.3)', borderRadius: '4px' }} />
                        <div style={{ width: '25%', height: '14px', background: 'rgba(100, 116, 139, 0.2)', borderRadius: '4px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        <div style={{ width: '80px', height: '20px', background: 'rgba(100, 116, 139, 0.3)', borderRadius: '4px' }} />
                        <div style={{ width: '60px', height: '16px', background: 'rgba(100, 116, 139, 0.2)', borderRadius: '4px' }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function PortfolioCardSkeleton() {
    return (
        <div className="animate-pulse" style={{
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.08)'
        }}>
            <div style={{ width: '30%', height: '16px', background: 'rgba(100, 116, 139, 0.3)', borderRadius: '4px', marginBottom: '12px' }} />
            <div style={{ width: '60%', height: '40px', background: 'rgba(100, 116, 139, 0.4)', borderRadius: '8px', marginBottom: '20px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {[1, 2, 3].map(i => (
                    <div key={i}>
                        <div style={{ width: '70%', height: '12px', background: 'rgba(100, 116, 139, 0.2)', borderRadius: '4px', marginBottom: '8px' }} />
                        <div style={{ width: '90%', height: '18px', background: 'rgba(100, 116, 139, 0.3)', borderRadius: '4px' }} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function StatsGridSkeleton() {
    return (
        <div className="animate-pulse" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[1, 2, 3, 4].map(i => (
                <div key={i} style={{
                    background: '#1e293b',
                    padding: '10px 8px',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <div style={{ width: '60%', height: '10px', background: 'rgba(100, 116, 139, 0.3)', borderRadius: '4px', margin: '0 auto 8px' }} />
                    <div style={{ width: '80%', height: '16px', background: 'rgba(100, 116, 139, 0.4)', borderRadius: '4px', margin: '0 auto' }} />
                </div>
            ))}
        </div>
    );
}

export function AssetListSkeleton() {
    return (
        <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[1, 2, 3].map(i => (
                <div key={i} style={{
                    background: '#1e293b',
                    padding: '15px',
                    borderRadius: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ width: '40%', height: '18px', background: 'rgba(100, 116, 139, 0.3)', borderRadius: '4px', marginBottom: '8px' }} />
                        <div style={{ width: '60%', height: '14px', background: 'rgba(100, 116, 139, 0.2)', borderRadius: '4px' }} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ width: '80px', height: '18px', background: 'rgba(100, 116, 139, 0.3)', borderRadius: '4px', marginBottom: '8px', marginLeft: 'auto' }} />
                        <div style={{ width: '100px', height: '14px', background: 'rgba(100, 116, 139, 0.2)', borderRadius: '4px' }} />
                    </div>
                </div>
            ))}
        </div>
    );
}
