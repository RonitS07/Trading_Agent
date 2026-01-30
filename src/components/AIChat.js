'use client';

import { useState, useRef, useEffect } from 'react';

// Constant for symbol detection
import { calculateRSI, calculateSMA } from '@/lib/indicators';

// Constant for symbol detection
const STOP_WORDS = [
    'THE', 'FOR', 'AND', 'WHAT', 'SELL', 'BUY', 'WITH', 'YOUR', 'THIS', 'THAT', 'FROM', 'HOW', 'PRICE', 'CHART', 'STOCK', 'PLANS', 'SHOULD', 'ABOUT',
    'HELLO', 'HI', 'HEY', 'WHO', 'ARE', 'YOU', 'TELL', 'ME', 'WHICH', 'WAS', 'IS', 'IT', 'IN', 'ON', 'OF', 'TO', 'MY', 'DO', 'CAN', 'WILL', 'BE',
    'HAVE', 'HAS', 'HAD', 'NOT', 'BUT', 'YEAH', 'OK', 'OKAY', 'THANKS', 'THANK', 'PLEASE', 'GIVE', 'SHOW', 'WHERE', 'WHEN', 'WHY', 'NOW', 'JUST',
    'GET', 'MAKE', 'KNOW', 'THINK', 'TIME', 'GOOD', 'BAD', 'LOOK', 'SEE', 'WANT', 'OUT', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'SHARE'
];

const ActionPlanner = {
    TEMPLATES: {
        OPENINGS: [
            "Processing real-time technicals...",
            "Analyzing market structure...",
            "Synthesizing order flow and momentum...",
            "Calculating key pivot points..."
        ],
        FOLLOW_UPS: [
            "Check the 4H chart for confirmation.",
            "Consider a trailing stop to lock profits.",
            "Watch for volume spikes at the breakout level.",
            "Is this fitting your risk profile?",
        ]
    },
    getRandom(list) {
        return list[Math.floor(Math.random() * list.length)];
    },

    async analyze(symbol, contextStock, user, historyData = []) {
        // 1. Calculate Indicators
        let rsiVal = 50;
        let smaVal = 0;
        let trend = "NEUTRAL";

        if (historyData.length > 20) {
            const rsiSeries = calculateRSI(historyData, 14);
            const smaSeries = calculateSMA(historyData, 20);

            if (rsiSeries.length > 0) rsiVal = rsiSeries[rsiSeries.length - 1].value;
            if (smaSeries.length > 0) smaVal = smaSeries[smaSeries.length - 1].value;
        }

        const price = contextStock?.price || (historyData.length > 0 ? historyData[historyData.length - 1].price : 0);

        // 2. Determine Bias
        let action = "HOLD";
        let zone = "";
        let reasoning = "";

        // Strategy Logic
        if (rsiVal > 70) {
            action = "SELL / WAIT";
            reasoning = `For **${symbol}**, RSI is currently ${rsiVal.toFixed(1)} (OVERSOLD). Momentum is stretched.`;
            if (price > smaVal) reasoning += ` Although price is above 20 SMA (₹${smaVal.toFixed(2)}), the trend checks indicate caution.`;
            zone = `Below ₹${(price * 0.99).toFixed(2)}`;
        } else if (rsiVal < 30) {
            action = "BUY / ACCUMULATE";
            reasoning = `**${symbol}** is in OVERSOLD territory (RSI ${rsiVal.toFixed(1)}). Good risk/reward for a bounce.`;
            zone = `Current Levels (₹${price.toFixed(2)})`;
        } else {
            // Mid Range
            if (price > smaVal) {
                action = "BUY DIP";
                reasoning = `**${symbol}** Uptrend confirmed (Price > 20 SMA). RSI (${rsiVal.toFixed(1)}) has room to run.`;
                zone = `Near SMA: ₹${smaVal.toFixed(2)}`;
            } else {
                action = "SELL RALLY";
                reasoning = `**${symbol}** shows visible weakness (Price < 20 SMA). RSI (${rsiVal.toFixed(1)}) is neutral/bearish.`;
                zone = `Resistance: ₹${smaVal.toFixed(2)}`;
            }
        }

        // Portfolio Integration
        const holdings = user?.portfolio || [];
        const currentHolding = holdings.find(h => h.symbol === symbol);
        if (currentHolding) {
            reasoning = `[Holding ${currentHolding.qty} @ ₹${currentHolding.avgCost.toFixed(2)}] ` + reasoning;
        }

        return {
            isGeneral: false,
            action,
            reasoning,
            zone,
            followUp: this.getRandom(this.TEMPLATES.FOLLOW_UPS)
        };
    },

    generateGeneral(userInput, user) {
        const goal = userInput.toLowerCase();
        const holdings = user?.portfolio || [];

        // 1. Portfolio/Account Queries
        if (goal.includes("portfolio") || goal.includes("balance") || goal.includes("funds")) {
            if (!user) return { isGeneral: true, content: "<p>Please login to view portfolio insights.</p>" };
            const summary = holdings.map(h => `${h.symbol}`).join(', ');
            return {
                isGeneral: true,
                content: `
                    <div class="portfolio-insight">
                        <div class="insight-title">PORTFOLIO INTELLIGENCE</div>
                        <p><strong>Active Assets:</strong> ${summary || 'No active positions detected.'}</p>
                        <p><strong>Available Capital:</strong> ₹${(user?.balance || 0).toLocaleString('en-IN')}</p>
                    </div>
                `
            };
        }

        // 2. Greetings & Identity
        if (goal.match(/^(hi|hello|hey|greetings)/)) {
            return {
                isGeneral: true,
                content: `<p class="ai-text">Greetings, <strong>${user?.name || 'Trader'}</strong>. Systems are nominal. I am ready to analyze market data or execute trades on your command.</p>`
            };
        }
        if (goal.includes("who are you") || goal.includes("what are you")) {
            return {
                isGeneral: true,
                content: `<p class="ai-text">I am <strong>TradePilot AI</strong>, an advanced algorithmic trading assistant designed to provide real-time technical analysis, risk assessment, and execution strategies.</p>`
            };
        }

        // 3. Educational / Definitions
        if (goal.includes("what is rsi")) {
            return {
                isGeneral: true,
                content: `<p class="ai-text"><strong>RSI (Relative Strength Index)</strong> measures the speed and change of price movements. <br/><br/>• <strong>> 70</strong>: Overbought (Potential Sell)<br/>• <strong>< 30</strong>: Oversold (Potential Buy)</p>`
            };
        }
        if (goal.includes("what is sma") || goal.includes("moving average")) {
            return {
                isGeneral: true,
                content: `<p class="ai-text"><strong>SMA (Simple Moving Average)</strong> calculates the average price over a specific period (e.g., 20 days). It helps identify the trend direction. Price above SMA usually indicates an uptrend.</p>`
            };
        }

        // 4. Help / Navigation
        if (goal.includes("how to buy") || goal.includes("how to trade")) {
            return {
                isGeneral: true,
                content: `<p class="ai-text">To execute a trade:<br/>1. Go to the <strong>Analysis Tab</strong>.<br/>2. Select a stock from the Watchlist.<br/>3. Use the Trade Panel on the right to set your Quantity and Price.</p>`
            };
        }

        // 5. Default Fallback (Smarter)
        const defaults = [
            "I'm listening. You can ask me to analyze a stock, explain technical indicators, or check your portfolio.",
            "Awaiting input. Try asking 'What is RSI?' or 'Analyze INFOSYS'.",
            "Systems standing by. I can calculate real-time technicals for any NSE stock."
        ];

        return {
            isGeneral: true,
            content: `
                <div class="ai-general-reply">
                    <p>${defaults[Math.floor(Math.random() * defaults.length)]}</p>
                </div>
            `
        };
    }
};

export default function AIChat({ selectedStockData, user }) {
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'TradePilot AI Strategy Engine online. I can calculate Real-Time RSI & SMA. Name a stock.' }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        setInput('');
        setIsThinking(true);

        const words = currentInput.toUpperCase().replace(/[?!.]/g, '').split(/\s+/);

        // 1. Check for Conversational/General Queries FIRST
        const generalResponse = ActionPlanner.generateGeneral(currentInput, user);
        // We need a way to know if generateGeneral matched a specific rule or just returned the random fallback.
        // Let's modify generateGeneral to flag this, or just check the content slightly.
        // Actually, the best way is to see if we CAN find a symbol. If we find a symbol, we prefer that UNLESS it's clearly a greeting.

        // Let's rely on an expanded STOP_WORDS list and better logic.
        const conversationalTriggers = ['HI', 'HELLO', 'HEY', 'WHO', 'WHAT', 'HOW', 'THANKS', 'THANK'];
        const isConversational = words.some(w => conversationalTriggers.includes(w));

        // Heuristic: finding capitalized words of length 3-10 that aren't stop words
        let potentialSymbol = null;
        if (!isConversational) {
            potentialSymbol = words.find(w => w.length >= 3 && w.length <= 10 && !STOP_WORDS.includes(w) && w === w.toUpperCase());
        }

        // If context exists and user says "this stock" or "analysis", use context
        if (!potentialSymbol && selectedStockData && (currentInput.toLowerCase().includes('this') || currentInput.toLowerCase().includes('analysis'))) {
            potentialSymbol = selectedStockData.symbol;
        }

        setTimeout(async () => {
            try {
                if (potentialSymbol) {
                    // Fetch History for Technicals
                    const res = await fetch(`/api/history?symbol=${potentialSymbol}&range=1mo`); // 1mo range for reasonable SMA20
                    const history = await res.json();

                    // Fetch Quote if needed
                    let stockInfo = selectedStockData;
                    if (!stockInfo || stockInfo.symbol !== potentialSymbol) {
                        const qRes = await fetch(`/api/quote?symbol=${potentialSymbol}`);
                        // If 404, assume it wasn't a stock after all and fall back to general
                        if (!qRes.ok) {
                            const res = ActionPlanner.generateGeneral(currentInput, user);
                            setMessages(prev => [...prev, { role: 'ai', content: res.content }]);
                            return;
                        }
                        stockInfo = await qRes.json();
                    }

                    const analysis = await ActionPlanner.analyze(potentialSymbol, stockInfo, user, Array.isArray(history) ? history : []);

                    const aiContent = `
                        <div class="ai-response-futuristic">
                            <div class="strategy-header">
                                <i class="fa-solid fa-microchip"></i>
                                <span>${analysis.action}: ${potentialSymbol}</span>
                            </div>
                            <p class="strategy-reasoning">${analysis.reasoning}</p>
                            <div class="strategy-zone">
                                <span class="z-label">TARGET ZONE:</span>
                                <span class="z-val">${analysis.zone}</span>
                            </div>
                            <div class="intent-discovery-v2">${analysis.followUp}</div>
                        </div>
                    `;
                    setMessages(prev => [...prev, { role: 'ai', content: aiContent }]);

                } else {
                    // General fallback
                    // Start by checking if we have a specific conversational answer
                    const res = ActionPlanner.generateGeneral(currentInput, user);
                    setMessages(prev => [...prev, { role: 'ai', content: res.content }]);
                }
            } catch (err) {
                // If error, fall back to general
                const res = ActionPlanner.generateGeneral(currentInput, user);
                setMessages(prev => [...prev, { role: 'ai', content: res.content }]);
            } finally {
                setIsThinking(false);
            }
        }, 800);
    };

    // ... (Keep existing UI rendering)
    const suggestions = ["Analyze RELIANCE", "Portfolio Status", "Strategy for TATASTEEL", "Market Outlook"];

    // ... helper for chips
    const handleSuggestionClick = (s) => setInput(s);

    return (
        <div className="ai-planner-view">
            <div className="chat-container-modern">
                {/* Header & Status - existing code */}
                <div className="chat-header-v2">
                    <div className="ai-status">
                        <div className="status-pulse"></div>
                        STRATEGY ENGINE ACTIVE
                    </div>
                </div>

                <div className="chat-history-v2">
                    {messages.map((m, i) => (
                        <div key={i} className={`chat-bubble-v2 ${m.role}`} style={{ animationDelay: `${i * 0.1}s` }}>
                            <div className="bubble-content" dangerouslySetInnerHTML={{ __html: m.content }}></div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="chat-bubble-v2 ai thinking">
                            <div className="bubble-content">
                                <div className="thinking-dots">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Suggestion Chips */}
                <div style={{ display: 'flex', gap: '8px', padding: '10px 15px', overflowX: 'auto', background: 'rgba(15, 23, 42, 0.3)' }} className="no-scrollbar-chips">
                    {["Analyze RELIANCE", "Strategy for TATASTEEL (RSI)", "Market Outlook"].map((s, i) => (
                        <button
                            key={i}
                            onClick={() => handleSuggestionClick(s)}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '15px',
                                padding: '6px 12px',
                                color: 'var(--accent-cyan)',
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer'
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <form className="chat-input-v2" onSubmit={handleSend}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask for strategy (e.g., 'Analyze WIPRO')..."
                    />
                    <button type="submit"><i className="fa-solid fa-bolt"></i></button>
                </form>
            </div>
        </div>
    );
}
