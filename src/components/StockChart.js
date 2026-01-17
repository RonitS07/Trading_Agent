'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Simple memory cache
const chartCache = {};
const EMPTY_ARRAY = [];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="tooltip-date">
                    {new Date(label).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="tooltip-price">₹{payload[0].value.toFixed(2)}</p>
            </div>
        );
    }
    return null;
};

export default function StockChart({ symbol, range = '1d', holdings = EMPTY_ARRAY, trades = EMPTY_ARRAY, currentBalance = 0 }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [opacity, setOpacity] = useState(0); // For fade-in effect

    useEffect(() => {
        if (!symbol) return;

        const effectiveKey = `${symbol}-${range}`;
        if (symbol !== 'PORTFOLIO' && chartCache[effectiveKey]) {
            setData(chartCache[effectiveKey]);
            setLoading(false);
            setOpacity(1); // Instant show
            return;
        }

        setLoading(true);
        setOpacity(0.5); // Dim if keeping old data

        const fetchData = async () => {
            try {
                // CASE 1: Composite Portfolio Chart
                if (symbol === 'PORTFOLIO') {
                    // Collect all unique symbols involved (current holdings + past trades)
                    const involvedSymbols = new Set(holdings.map(h => h.symbol));
                    trades.forEach(t => involvedSymbols.add(t.symbol));
                    const uniqueSymbols = Array.from(involvedSymbols);

                    if (uniqueSymbols.length === 0) {
                        const now = Date.now();
                        const interval = range === '1d' ? 60000 * 5 : 86400000;
                        const points = range === '1d' ? 75 : 30;
                        const mockZero = [];
                        for (let i = points; i >= 0; i--) {
                            mockZero.push({ time: now - (i * interval), price: currentBalance || 0 });
                        }
                        setData(mockZero);
                        return;
                    }

                    // Fetch history for ALL involved symbols
                    const requests = uniqueSymbols.map(sym =>
                        fetch(`/api/history?symbol=${sym}&range=${range}`).then(res => res.json())
                    );
                    const results = await Promise.all(requests);
                    const priceMap = {};

                    results.forEach((res, i) => {
                        if (Array.isArray(res) && res.length > 0) {
                            priceMap[uniqueSymbols[i]] = res;
                        }
                    });

                    const validData = Object.values(priceMap)[0];
                    if (!validData) {
                        setData([]);
                        return;
                    }
                    const masterTimeline = validData.map(d => d.time);

                    // Reconstruct Portfolio Value logic
                    let runningCash = Number(currentBalance) || 0;
                    const runningHoldings = {};
                    holdings.forEach(h => runningHoldings[h.symbol] = Number(h.qty) || 0);

                    const sortedTrades = [...trades].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                    const compositeData = [];
                    // Iterate backwards from latest time to earliest
                    for (let i = masterTimeline.length - 1; i >= 0; i--) {
                        const t = masterTimeline[i];

                        // "Undo" trades that happened *after* this timestamp
                        while (sortedTrades.length > 0 && new Date(sortedTrades[0].timestamp).getTime() > t) {
                            const trade = sortedTrades.shift();
                            const qty = Number(trade.quantity) || 0;
                            const tradePrice = Number(trade.price) || 0;
                            const cost = qty * tradePrice;

                            if (trade.type === 'BUY') {
                                runningCash += cost;
                                runningHoldings[trade.symbol] = (runningHoldings[trade.symbol] || 0) - qty;
                            } else {
                                runningCash -= cost;
                                runningHoldings[trade.symbol] = (runningHoldings[trade.symbol] || 0) + qty;
                            }
                        }

                        let stockValue = 0;
                        for (const sym in runningHoldings) {
                            const qty = runningHoldings[sym];
                            if (qty > 0) {
                                const hist = priceMap[sym];
                                if (hist) {
                                    // Find closest point to T (or use index i as generic approximation for intraday alignment)
                                    const point = hist[i] || hist.find(p => p.time === t);
                                    const price = point ? (Number(point.price) || 0) : 0;
                                    stockValue += qty * price;
                                }
                            }
                        }

                        // Final Safety Check
                        const totalEquity = runningCash + stockValue;
                        if (!isNaN(totalEquity)) {
                            compositeData.unshift({ time: t, price: totalEquity });
                        } else {
                            // Fallback to previous known good value or 0 to prevent gap
                            const prev = compositeData[0] ? compositeData[0].price : 0;
                            compositeData.unshift({ time: t, price: prev });
                        }
                    }

                    setData(compositeData);

                }
                // CASE 2: Single Stock Chart
                else {
                    const res = await fetch(`/api/history?symbol=${symbol}&range=${range}`);
                    const json = await res.json();
                    if (Array.isArray(json)) {
                        chartCache[effectiveKey] = json; // Cache the result
                        setData(json);
                    }
                }
            } catch (err) {
                // silent
            } finally {
                setLoading(false);
                setTimeout(() => setOpacity(1), 50); // Trigger fade in
            }
        };

        fetchData();
    }, [symbol, range, holdings, trades, currentBalance]);

    if (loading && data.length === 0) return (
        <div className="chart-overlay fade-in">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ color: 'var(--accent-cyan)', fontSize: '1.5rem' }}></i>
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Loading Market Data...</span>
            </div>
        </div>
    );


    if (!data.length) return <div className="chart-overlay" style={{ background: 'none' }}>Data unavailable</div>;

    const startVal = data[0]?.price || 0;
    const endVal = data[data.length - 1]?.price || 0;
    const isUp = endVal >= startVal;
    const color = isUp ? '#22c55e' : '#ef4444'; // Green or Red
    const gradientId = isUp ? 'colorUp' : 'colorDown';

    return (
        <div style={{
            width: '100%',
            height: 300,
            opacity: opacity,
            transition: 'opacity 0.4s ease-out'
        }}>
            <ResponsiveContainer minWidth={0} minHeight={0}>
                <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                        width={45}
                        tickFormatter={(val) => `₹${(val / 1000).toFixed(1)}k`}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                    />
                    <CartesianGrid vertical={false} stroke="#1e293b" strokeDasharray="3 3" />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke={color}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#${gradientId})`}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
