'use client';

import { useState, useRef, useEffect } from 'react';

// Enhanced contextual logic
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

        const isEmotional = goal.includes("panic") || goal.includes("scared") || goal.includes("help") || goal.includes("quick money") || goal.includes("profit fast") || goal.includes("recover");

        if (isEmotional) {
            return {
                isGeneral: true,
                content: `
                    <div class="ai-warning">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <strong>Emotional volatility detected in query.</strong>
                        <p>High-frequency trading requires a disciplined approach. We should avoid revenge trading or FOMO entries. Let's look at the volatility index first.</p>
                    </div>
                `
            };
        }

        if (goal.includes("portfolio") || goal.includes("balance") || goal.includes("holdings") || goal.includes("my shares")) {
            if (!user) return { isGeneral: true, content: "<p>Please login to view portfolio insights.</p>" };
            if (holdings.length === 0) return { isGeneral: true, content: "<p>Your portfolio is currently empty. Start by adding a blue-chip stock from the sidebar.</p>" };

            const summary = holdings.map(h => `${h.symbol} (${h.qty} shares)`).join(', ');
            return {
                isGeneral: true,
                content: `
                    <div class="portfolio-insight">
                        <div class="insight-title">PORTFOLIO OVERVIEW</div>
                        <p>You currently have exposure in: <strong>${summary}</strong>.</p>
                        <p>Your cash balance is ₹${user.balance.toLocaleString('en-IN')}. Diversification into defensive sectors is recommended given current market sentiment.</p>
                    </div>
                `
            };
        }

        if (!stock) {
            return {
                isGeneral: true,
                content: `
                    <p>${this.getRandom(this.TEMPLATES.OPENINGS)}</p>
                    <p>To provide a high-precision strategy, please select a stock from the sidebar or ask about your portfolio.</p>
                `
            };
        }

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
            followUp: this.getRandom(this.FOLLOW_UPS)
        };
    }
};

export default function AIChat({ selectedStockData, user }) {
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'TradePilot AI Strategy Engine online. How can I assist with your portfolio today?' }
    ]);
    const [input, setInput] = useState('');
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
        setInput('');

        // Simulate AI thinking
        setTimeout(() => {
            const res = ActionPlanner.generate(input, selectedStockData, user);
            let aiContent = "";
            if (res.isGeneral) {
                aiContent = res.content;
            } else {
                aiContent = `
                    <div class="ai-response-futuristic">
                        <div class="strategy-header">
                            <i class="fa-solid fa-microchip"></i>
                            <span>${res.action} STRATEGY</span>
                        </div>
                        <p class="strategy-reasoning">${res.reasoning}</p>
                        <div class="strategy-zone">
                            <span class="z-label">EXECUTION ZONE:</span>
                            <span class="z-val">${res.zone}</span>
                        </div>
                        <div class="intent-discovery-v2">${res.followUp}</div>
                    </div>
                `;
            }
            setMessages(prev => [...prev, { role: 'ai', content: aiContent }]);
        }, 600);
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
                        <div key={i} className={`chat-bubble-v2 ${m.role}`}>
                            <div className="bubble-content" dangerouslySetInnerHTML={{ __html: m.content }}></div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
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
