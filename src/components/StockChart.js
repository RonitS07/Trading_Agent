'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StockChart({ symbol, range = '1d' }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!symbol) return;
        setLoading(true);
        fetch(`/api/history?symbol=${symbol}&range=${range}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setData(data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [symbol, range]);

    if (loading) return <div className="chart-overlay">Loading Chart...</div>;
    if (!data.length) return <div className="chart-overlay" style={{ background: 'none' }}>Select a stock to view chart</div>;

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="time"
                        tickFormatter={(tick) => {
                            const date = new Date(tick);
                            return range === '1d'
                                ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                        }}
                        hide={false}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        domain={['auto', 'auto']}
                        orientation="right"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                    />
                    <Tooltip
                        contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                        itemStyle={{ color: '#06b6d4' }}
                        labelStyle={{ color: '#94a3b8' }}
                        labelFormatter={(label) => new Date(label).toLocaleString()}
                    />
                    <CartesianGrid vertical={false} stroke="#1e293b" strokeDasharray="3 3" />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#06b6d4"
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
