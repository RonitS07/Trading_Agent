'use client';

import { useState, useRef, useEffect } from 'react';

// Constant for symbol detection
const STOP_WORDS = ['THE', 'FOR', 'AND', 'WHAT', 'SELL', 'BUY', 'WITH', 'YOUR', 'THIS', 'THAT', 'FROM', 'HOW', 'PRICE', 'CHART', 'STOCK', 'PLANS', 'SHOULD', 'ABOUT'];
const ActionPlanner = {
    TEMPLATES: {
        OPENINGS: [
            "Analyzing market liquidity and order flow for your query.",
            "Synthesizing technical signals with your current exposure.",
            "Market volatility is peaking. Here's my strategic assessment.",
            "Running simulations on current price action and historical support.",
            "TradePilot AI is processing your request with real-time data."
        ],
        FOLLOW_UPS: [
            "Do you want to hedge this with index futures?",
            "Should we set an automated trailing stop-loss for this?",
            "Are you comfortable with the current margin requirements?",
            "Would you like to see a risk/reward heat map for this entry?",
            "Is capital preservation your primary objective today?"
        ]
    },
    getRandom(list) {
        return list[Math.floor(Math.random() * list.length)];
    },
    generate(userInput, stock = null, user = null) {
        const goal = userInput.toLowerCase();
        const holdings = user?.portfolio || [];
        const currentHolding = stock ? holdings.find(h => h.symbol === stock.symbol) : null;

        // Portfolio-related queries
        if (goal.includes("portfolio") || goal.includes("balance") || goal.includes("holdings") || goal.includes("my shares") || goal.includes("net worth")) {
            if (!user) return { isGeneral: true, content: "<p>Please login to view portfolio insights.</p>" };
            if (holdings.length === 0) return { isGeneral: true, content: "<p>Your portfolio is currently empty. Start by adding a blue-chip stock from the sidebar.</p>" };

            const summary = holdings.map(h => `${h.symbol} (${h.qty} shares)`).join(', ');
            return {
                isGeneral: true,
                content: `
                    <div class="portfolio-insight">
                        <div class="insight-title">PORTFOLIO OVERVIEW</div>
                        <p>You currently have exposure in: <strong>${summary}</strong>.</p>
                        <p>Your total cash balance is ₹${(user?.balance || 0).toLocaleString('en-IN')}. Diversification into defensive sectors is recommended given current market sentiment.</p>
                    </div>
                `
            };
        }

        // Strategy queries with a selected stock
        if (stock && (
            goal.includes("buy") || goal.includes("sell") || goal.includes("strategy") ||
            goal.includes("plan") || goal.includes("trade") || goal.includes("target") ||
            goal.includes("tell") || goal.includes("about") || goal.includes("review") ||
            goal.includes("predict") || goal.includes("forecast") || goal.includes("outlook") ||
            goal.includes("analysis") || goal.includes("thoughts")
        )) {
            const price = stock.price || 0;
            const change = stock.changePct || 0;
            let horizon = "SWING";
            if (goal.includes("intraday") || goal.includes("short")) horizon = "INTRADAY";
            if (goal.includes("long") || goal.includes("year") || goal.includes("investment")) horizon = "LONG-TERM";

            const isSellIntent = goal.includes("sell") || goal.includes("exit") || goal.includes("profit");
            let action = "HOLD";
            let reasoning = "";
            let zone = "";

            if (currentHolding) {
                reasoning = `You already hold ${currentHolding.qty} shares of ${stock.symbol} at an average of ₹${currentHolding.avgCost.toFixed(2)}. `;
                if (isSellIntent) {
                    action = "EXIT/REDUCE";
                    zone = `₹${(price * 1.02).toFixed(2)}+`;
                    reasoning += `Profit taking is advisable as the RSI indicates overbought levels for this ${horizon} position.`;
                } else if (price < currentHolding.avgCost * 0.95) {
                    action = "AVERAGE DOWN";
                    zone = `₹${(price * 0.99).toFixed(2)} - ₹${price.toFixed(2)}`;
                    reasoning += `Your position is currently down. Averaging here could lower your cost basis significantly.`;
                } else {
                    action = "HOLD/PYRAMID";
                    zone = `₹${(price * 1.01).toFixed(2)}`;
                    reasoning += `Momentum is strong. Consider adding to your winners.`;
                }
            } else {
                if (isSellIntent) {
                    action = "NEUTRAL";
                    zone = "N/A";
                    reasoning = `You don't have an active position in ${stock.symbol} to exit.`;
                } else {
                    action = "BUY/ENTER";
                    zone = `₹${(price * 0.98).toFixed(2)} - ₹${price.toFixed(2)}`;
                    reasoning = `${stock.symbol} setup looks favorable for a ${horizon} entry. Volume profile is increasing.`;
                }
            }

            return {
                isGeneral: false,
                action,
                reasoning,
                zone,
                followUp: this.getRandom(this.TEMPLATES.FOLLOW_UPS)
            };
        }

        // General fallback for all other queries
        return {
            isGeneral: true,
            content: `
                <div class="ai-general-reply">
                    <p>${this.getRandom(this.TEMPLATES.OPENINGS)}</p>
                    <p>I'm here to help with your trading strategy and portfolio management. You can ask about specific stocks, your current holdings, or general market sentiment.</p>
                    <p style="opacity: 0.7; font-size: 0.8rem; margin-top: 10px;">TIP: Select a stock from the sidebar to get a detailed execution strategy.</p>
                </div>
            `
        };
    }
};

export default function AIChat({ selectedStockData, user }) {
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'TradePilot AI Strategy Engine online. How can I assist with your portfolio today?' }
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

        // Improved symbol detection: only trigger if it's clearly a ticker query
        const words = currentInput.toUpperCase().replace(/[?!.]/g, '').split(/\s+/);

        // Check if this is a clear ticker symbol query:
        // 1. Single word query (e.g., "RELIANCE"), OR
        // 2. Contains buy/sell keywords with a symbol-like word
        const isSingleWord = words.length === 1;
        const hasBuySellKeyword = currentInput.toLowerCase().includes('buy ') ||
            currentInput.toLowerCase().includes('sell ') ||
            currentInput.toLowerCase().includes('strategy for ') ||
            currentInput.toLowerCase().includes('about ');

        let potentialSymbol = null;

        // Only look for symbols if it's a single word OR has buy/sell context
        if (isSingleWord && words[0].length >= 3 && words[0].length <= 10 && !STOP_WORDS.includes(words[0])) {
            potentialSymbol = words[0];
        } else if (hasBuySellKeyword) {
            // Find the most likely symbol (all caps, 3-10 chars, not a stop word)
            potentialSymbol = words.find(w =>
                w.length >= 3 &&
                w.length <= 10 &&
                !STOP_WORDS.includes(w) &&
                w === w.toUpperCase() // Must be all uppercase
            );
        }

        // Simulate AI thinking
        setTimeout(async () => {
            setIsThinking(false);
            try {
                let contextStock = selectedStockData;

                // If the user mentioned a symbol, try to fetch its data if needed
                if (potentialSymbol) {
                    // Only fetch if it differs from context or context is missing
                    if (!selectedStockData || !selectedStockData.symbol.includes(potentialSymbol)) {
                        try {
                            const searchRes = await fetch(`/api/search?q=${potentialSymbol}`);
                            const searchData = await searchRes.json();
                            if (searchData.length > 0) {
                                const exactSymbol = searchData[0].symbol;
                                const quoteRes = await fetch(`/api/quote?symbol=${exactSymbol}`);
                                contextStock = await quoteRes.json();
                            } else {
                                // CASE: Symbol mentioned but not found.
                                // STOP here. Do not fallback to selectedStockData, as that is confusing.
                                setMessages(prev => [...prev, { role: 'ai', content: `<p>I couldn't identify market data for <strong>${potentialSymbol}</strong>. Please try using the correct NSE ticker symbol.</p>` }]);
                                return;
                            }
                        } catch (err) {
                            // On network error also stop
                            setMessages(prev => [...prev, { role: 'ai', content: `<p>Comparison data unavailable at the moment.</p>` }]);
                            return;
                        }
                    }
                }

                const res = ActionPlanner.generate(currentInput, contextStock, user);
                let aiContent = "";
                if (res.isGeneral) {
                    aiContent = res.content;
                } else {
                    aiContent = `
                        <div class="ai-response-futuristic">
                            <div class="strategy-header">
                                <i class="fa-solid fa-microchip"></i>
                                <span>${res.action || 'NEUTRAL'} STRATEGY: ${contextStock?.symbol || ''}</span>
                            </div>
                            <p class="strategy-reasoning">${res.reasoning || 'No specific reasoning available for this setup.'}</p>
                            <div class="strategy-zone">
                                <span class="z-label">EXECUTION ZONE:</span>
                                <span class="z-val">${res.zone || 'N/A'}</span>
                            </div>
                            <div class="intent-discovery-v2">${res.followUp || ''}</div>
                        </div>
                    `;
                }
                setMessages(prev => [...prev, { role: 'ai', content: aiContent }]);
            } catch (err) {
                // Silent error
                // console.error("AI Generation Error:", err);
                setMessages(prev => [...prev, { role: 'ai', content: "<p>I encountered an error processing that request. Please try selecting a stock or rephrasing.</p>" }]);
            }
        }, 600);
    };

    const suggestions = [
        "Analyze my portfolio health",
        "Market sentiment outlook",
        "Strategy for RELIANCE",
        "Risk management advice"
    ];

    const handleSuggestionClick = (suggestion) => {
        setInput(suggestion);
        // Optional: auto-submit or let user edit
    };

    return (
        <div className="ai-planner-view">
            <div className="chat-container-modern">
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
                <div style={{ display: 'flex', gap: '8px', padding: '10px 15px', overflowX: 'auto', background: 'rgba(15, 23, 42, 0.3)', msOverflowStyle: 'none', scrollbarWidth: 'none' }} className="no-scrollbar-chips">
                    <style jsx>{`
                        .no-scrollbar-chips::-webkit-scrollbar { display: none; }
                    `}</style>
                    {suggestions.map((s, i) => (
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
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
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
                        placeholder="Ask for strategy, portfolio insights, or market bias..."
                    />
                    <button type="submit">
                        <i className="fa-solid fa-bolt"></i>
                    </button>
                </form>
            </div>
        </div>
    );
}
