/**
 * PROTRADE INDIA - ELITE DASHBOARD ENGINE
 * High-fidelity trading logic with Indian taxation and AI Strategic Planning.
 */

const STATE = {
    watchlist: JSON.parse(localStorage.getItem('watchlist')) || ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS"],
    currentStock: null,
    stockData: new Map(),

    // Paper Trading State
    balance: parseFloat(localStorage.getItem('paper_balance')) || 100000.00,
    portfolio: JSON.parse(localStorage.getItem('paper_portfolio')) || {}, // { symbol: { qty, avgCost } }
    trades: JSON.parse(localStorage.getItem('paper_trades')) || [],

    activeTab: 'tab-overview'
};

// --- DATA LAYER ---
async function searchAPI(query) {
    if (query.length < 2) return [];
    try {
        const res = await fetch(`/api/search?q=${query}`);
        return await res.json();
    } catch { return []; }
}

async function getQuote(symbol) {
    try {
        const res = await fetch(`/api/quote?symbol=${symbol}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    } catch { return null; }
}

// --- TAX ENGINE (INDIAN MARKETS) ---
class TaxEngine {
    static calculate(action, price, qty) {
        const turnover = price * qty;

        // Indian Delivery-based Levies (Approximate NSE/BSE)
        const stt = turnover * 0.001; // 0.1% STT on both buy/sell
        const stampDuty = action === 'BUY' ? turnover * 0.00015 : 0; // 0.015% only on Buy
        const exchCharges = turnover * 0.0000345; // ~0.00345% (NSE Approx)
        const sebiFee = turnover * 0.0000001; // ₹10 per crore
        const gst = (exchCharges + sebiFee) * 0.18; // 18% GST on exchange & SEBI fees

        const totalTax = stt + stampDuty + exchCharges + sebiFee + gst;

        return {
            total: totalTax,
            stt,
            stampDuty,
            gst,
            other: exchCharges + sebiFee
        };
    }
}

// --- MARKET CALENDAR ---
const HOLIDAYS_2025 = [
    "2025-01-26", // Republic Day
    "2025-02-26", // Mahashivratri
    "2025-03-14", // Holi
    "2025-03-31", // Id-ul-Fitr
    "2025-04-10", // Mahavir Jayanti
    "2025-04-14", // Dr. Baba Saheb Ambedkar Jayanti
    "2025-04-18", // Good Friday
    "2025-05-01", // Maharashtra Day
    "2025-05-12", // Buddha Purnima
    "2025-08-15", // Independence Day
    "2025-08-27", // Ganesh Chaturthi
    "2025-10-02", // Mahatma Gandhi Jayanti
    "2025-10-20", // Diwali-Laxmi Pujan
    "2025-10-22", // Diwali-Balipratipada
    "2025-11-05", // Guru Nanak Jayanti
    "2025-12-25"  // Christmas
];

// --- LIVE TICKER ENGINE ---
class LiveTicker {
    constructor() {
        this.activeSymbols = new Set(STATE.watchlist);
        this.tickInterval = null;
        this.syncInterval = null;
    }

    start() {
        if (this.tickInterval) return;
        this.tickInterval = setInterval(() => this.tick(), 1000);
        this.syncInterval = setInterval(() => this.sync(), 10000);
        this.sync();
    }

    async sync() {
        const symbols = Array.from(this.activeSymbols);
        for (const sym of symbols) {
            const data = await getQuote(sym);
            if (data) {
                STATE.stockData.set(sym, {
                    ...data,
                    displayPrice: data.price,
                    volatility: 0.0005
                });
                if (STATE.currentStock?.symbol === sym) {
                    STATE.currentStock = STATE.stockData.get(sym);
                }
            }
        }
        UI.renderWatchlist();
        UI.renderPortfolio();
        UI.updateGlobalAI();
    }

    tick() {
        const market = UI.getMarketStatus();
        if (!market.isOpen) return;

        this.activeSymbols.forEach(sym => {
            const stock = STATE.stockData.get(sym);
            if (!stock) return;

            const change = (Math.random() - 0.5) * (stock.displayPrice * stock.volatility);
            stock.displayPrice += change;

            UI.updateStockDisplay(sym, stock, change > 0);
        });

        // Dynamic dashboard updates
        if (STATE.activeTab === 'tab-overview') UI.renderPortfolio();
        if (STATE.activeTab === 'tab-analysis' && STATE.currentStock) UI.updateTradePreview();
    }

    track(sym) {
        this.activeSymbols.add(sym);
        this.sync();
    }
}

const Ticker = new LiveTicker();

// --- ADVANCED AI PLANNER ---
class ActionPlanner {
    static TEMPLATES = {
        OPENINGS: [
            "That's a thoughtful question regarding the markets.",
            "Navigating current market conditions requires a strategic perspective.",
            "Interesting angle. Let's look at that from a market intelligence lens.",
            "I've analyzed the current sentiment to help frame this for you.",
            "Market shifts are constant; here's how to view your query."
        ],
        FOLLOW_UPS: [
            "Are you looking at short-term movement or long-term holding?",
            "Is capital protection more important than returns for you right now?",
            "Are you observing the market or actively planning an entry?",
            "What kind of risk levels are you comfortable with for this goal?",
            "Is this for a core portfolio or a more aggressive growth strategy?"
        ],
        UNCERTAINTY: [
            "Market opportunities are highly dependent on individual context.",
            "The 'right' move is often tied to your specific time horizon.",
            "Current volatility makes a fixed answer difficult without deeper context.",
            "Financial decisions should always align with your broader entry strategy."
        ]
    };

    static getRandom(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    static generateMarketAdvice() {
        // Scans the watchlist for momentum
        const stocks = Array.from(STATE.stockData.values());
        if (stocks.length === 0) return "Markets are currently silent. Build your watchlist to get AI-driven insights.";

        const bullish = stocks.filter(s => s.changePct > 1).map(s => s.symbol);
        const bearish = stocks.filter(s => s.changePct < -1).map(s => s.symbol);

        let advice = "<strong>Market Sentiment:</strong> " + (bullish.length > bearish.length ? "BULLISH" : "CAUTIOUS") + "<br><br>";

        if (bullish.length > 0) {
            advice += `🔥 <strong>Momentum:</strong> ${bullish.slice(0, 2).join(', ')} are moving up.<br>`;
        }
        if (bearish.length > 0) {
            advice += `📉 <strong>Dip Watch:</strong> ${bearish.slice(0, 2).join(', ')} cooling off.<br>`;
        }

        return advice + "<br>Select a stock for a deep-dive execution strategy.";
    }

    static generate(userInput, stock = null) {
        const input = userInput.toUpperCase();
        const goal = userInput.toLowerCase();

        // 1. Detect Intent: Soft Stock Mention (but not selected)
        if (!stock) {
            const symbols = Array.from(STATE.stockData.keys()).concat(STATE.watchlist);
            const mentioned = symbols.find(s => input.includes(s.split('.')[0]));

            if (mentioned) {
                return {
                    isGeneral: true,
                    content: `
                        <div class="ai-response">
                            <p>${this.getRandom(this.TEMPLATES.OPENINGS)}</p>
                            <p>I noticed you mentioned <strong>${mentioned}</strong>. To provide a deep-dive analysis with live signals and optimal entry zones, please formally select it from the search or watchlist.</p>
                            <p>Generally, when holding a specific equity, it's vital to weigh the current sector momentum against your entry price.</p>
                            <div class="intent-discovery">${this.getRandom(this.TEMPLATES.FOLLOW_UPS)}</div>
                        </div>
                    `
                };
            }
        }

        // 2. Detect Intent: General Market Questions
        if (!stock || goal.includes("what to buy") || goal.includes("good stock") || goal.includes("invest in")) {
            return {
                isGeneral: true,
                content: `
                    <div class="ai-response">
                        <p>${this.getRandom(this.TEMPLATES.OPENINGS)}</p>
                        <p>${this.getRandom(this.TEMPLATES.UNCERTAINTY)}</p>
                        <p>Currently, we're seeing rotation in sectors like <strong>Finance and IT</strong>. Rather than picking single stocks blindly, consider whether you're targeting defensive stability or aggressive growth themes.</p>
                        <div class="intent-discovery">${this.getRandom(this.TEMPLATES.FOLLOW_UPS)}</div>
                    </div>
                `
            };
        }

        // 3. Stock Specific Analysis (Selected Stock)
        const price = stock.displayPrice;
        const change = stock.changePct;
        const isSafeGoal = goal.includes("safe") || goal.includes("long") || goal.includes("retirement");

        let action = "HOLD";
        let reasoning = "";
        let risk = "MEDIUM";
        let zone = `₹${(price * 0.98).toFixed(2)} - ₹${price.toFixed(2)}`;

        if (change >= 0 && isSafeGoal) {
            action = "ACCUMULATE";
            reasoning = `${stock.symbol} is showing stable positive momentum. For long-term portfolios, this is a prime candidate for monthly accumulation.`;
        } else if (change < -2) {
            action = "BUY ON DIP";
            risk = "MODERATE";
            reasoning = `The ${change}% drop for ${stock.symbol} looks like a healthy correction. This is a strategic entry for a bounce play.`;
        } else {
            reasoning = `Market for ${stock.symbol} is in equilibrium. No strong momentum signals. Alignment with your goal is currently neutral.`;
        }

        return {
            isGeneral: false,
            action,
            risk,
            reasoning,
            zone,
            followUp: this.getRandom(this.TEMPLATES.FOLLOW_UPS)
        };
    }
}

// --- UI CONTROLLER ---
const UI = {
    els: {
        navBtns: document.querySelectorAll('.nav-btn'),
        tabs: document.querySelectorAll('.tab-content'),
        omnibar: document.getElementById('omnibar-input'),
        searchResults: document.getElementById('search-results'),

        // Portfolio Stat Els
        portCash: document.getElementById('port-cash'),
        portInvested: document.getElementById('port-invested'),
        portTotal: document.getElementById('port-total'),
        portPnl: document.getElementById('port-pnl'),

        // Dashboard Els
        marketAiBox: document.getElementById('market-ai-advice'),
        activityLog: document.getElementById('activity-log'),
        watchlistCont: document.getElementById('watchlist-container'),
        holdingsCont: document.getElementById('holdings-container'),

        // Analysis Els
        mainSymbol: document.getElementById('main-symbol'),
        mainName: document.getElementById('main-name'),
        mainPrice: document.getElementById('main-price'),
        mainChange: document.getElementById('main-change'),
        liveIndicator: document.getElementById('live-status'),
        statHigh: document.getElementById('stat-high'),
        statLow: document.getElementById('stat-low'),
        statVol: document.getElementById('stat-vol'),

        // Trade Els
        marketLocked: document.getElementById('market-locked-msg'),
        tradeQty: document.getElementById('trade-qty'),
        orderVal: document.getElementById('trade-order-value'),
        taxStt: document.getElementById('tax-stt'),
        taxStamp: document.getElementById('tax-stamp'),
        taxExch: document.getElementById('tax-exch'),
        taxGst: document.getElementById('tax-gst'),
        tradeTotalEst: document.getElementById('trade-total-est'),
        btnBuy: document.getElementById('btn-buy'),
        btnSell: document.getElementById('btn-sell'),

        // Sentiment
        sentimentFill: document.getElementById('sentiment-fill'),
        sentimentPct: document.getElementById('sentiment-pct'),

        // AI Planner Els
        planInput: document.getElementById('plan-input'),
        btnPlan: document.getElementById('btn-generate-plan'),
        planOutput: document.getElementById('plan-output'),

        marketBadge: document.getElementById('market-status-badge'),
        toast: document.getElementById('toast')
    },

    init() {
        Ticker.start();
        this.bindEvents();
        this.updateMarketStatus();
        this.renderPortfolio();
        this.renderWatchlist();
        this.renderActivity();
        setInterval(() => this.updateMarketStatus(), 30000);
    },

    bindEvents() {
        // Tab Switching
        this.els.navBtns.forEach(btn => {
            btn.onclick = () => this.switchTab(btn.dataset.tab);
        });

        // Search
        let debounce;
        this.els.omnibar.addEventListener('input', (e) => {
            clearTimeout(debounce);
            debounce = setTimeout(() => this.handleSearch(e.target.value), 300);
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-box')) this.els.searchResults.classList.add('hidden');
        });

        // Trade Inputs
        this.els.tradeQty.oninput = () => this.updateTradePreview();

        // Trade Actions
        this.els.btnBuy.onclick = () => this.handleTransaction('BUY');
        this.els.btnSell.onclick = () => this.handleTransaction('SELL');

        // AI Planner
        this.els.btnPlan.onclick = () => this.generatePlan();
    },

    switchTab(tabId) {
        STATE.activeTab = tabId;
        this.els.navBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
        this.els.tabs.forEach(tab => {
            tab.classList.remove('active', 'show');
            if (tab.id === tabId) {
                tab.classList.add('active');
                setTimeout(() => tab.classList.add('show'), 10);
            }
        });
    },

    getMarketStatus() {
        const now = new Date();
        const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const dateStr = ist.toISOString().split('T')[0];
        const day = ist.getDay();
        const time = ist.getHours() * 60 + ist.getMinutes();

        const isHoliday = HOLIDAYS_2025.includes(dateStr);
        const isWeekend = day === 0 || day === 6;
        const isOutsideHours = time < 555 || time > 930; // 9:15 AM to 3:30 PM

        let statusText = 'NSE/BSE LIVE';
        let isOpen = true;

        if (isHoliday) {
            statusText = 'MARKET CLOSED (Holiday)';
            isOpen = false;
        } else if (isWeekend) {
            statusText = 'MARKET CLOSED (Weekend)';
            isOpen = false;
        } else if (isOutsideHours) {
            statusText = 'MARKET CLOSED';
            isOpen = false;
        }

        return { isOpen, statusText };
    },

    updateMarketStatus() {
        const market = this.getMarketStatus();
        this.els.marketBadge.className = `market-tag ${market.isOpen ? '' : 'closed'}`;
        this.els.marketBadge.innerText = market.statusText;
        this.els.marketLocked.classList.toggle('hidden', market.isOpen);
        this.els.btnBuy.disabled = !market.isOpen;
        this.els.btnSell.disabled = !market.isOpen;
    },

    async handleSearch(q) {
        if (!q) { this.els.searchResults.classList.add('hidden'); return; }
        const data = await searchAPI(q);
        this.els.searchResults.innerHTML = '';
        if (data.length === 0) { this.els.searchResults.classList.add('hidden'); return; }

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'w-item';
            div.innerHTML = `<span>${item.symbol}</span><span style="font-size:0.7rem; opacity:0.6">${item.shortname}</span>`;
            div.onclick = () => {
                this.loadStock(item.symbol);
                Ticker.track(item.symbol);
                this.els.omnibar.value = '';
                this.els.searchResults.classList.add('hidden');
                this.switchTab('tab-analysis');
            };
            this.els.searchResults.appendChild(div);
        });
        this.els.searchResults.classList.remove('hidden');
    },

    async loadStock(symbol) {
        const data = await getQuote(symbol);
        if (!data) return;
        STATE.currentStock = { ...data, displayPrice: data.price };
        STATE.stockData.set(symbol, STATE.currentStock);
        this.updateStockDisplay(symbol, STATE.currentStock);
        this.updateTradePreview();
        this.els.planOutput.innerHTML = '<div class="placeholder-msg">Set context to analyze strategies.</div>';
    },

    updateStockDisplay(symbol, stock, isUpTick = null) {
        if (STATE.currentStock?.symbol === symbol) {
            this.els.mainSymbol.innerText = symbol;
            this.els.mainName.innerText = "NSE/BSE Listed Equity";
            this.els.mainPrice.innerText = `₹${stock.displayPrice.toFixed(2)}`;
            const isPos = stock.changePct >= 0;
            this.els.mainChange.className = `change-badge ${isPos ? 'up' : 'down'}`;
            this.els.mainChange.innerText = `${isPos ? '+' : ''}${stock.changePct}%`;
            this.els.liveIndicator.classList.remove('hidden');

            this.els.statHigh.innerText = `₹${(stock.displayPrice * 1.01).toFixed(2)}`;
            this.els.statLow.innerText = `₹${(stock.displayPrice * 0.99).toFixed(2)}`;
            this.els.statVol.innerText = (Math.random() * 10).toFixed(1) + "M";

            if (isUpTick !== null) {
                this.els.mainPrice.classList.add(isUpTick ? 'text-green' : 'text-red');
                setTimeout(() => this.els.mainPrice.classList.remove('text-green', 'text-red'), 500);
            }
        }
        this.renderWatchlist();
    },

    updateTradePreview() {
        const stock = STATE.currentStock;
        if (!stock) return;
        const qty = parseInt(this.els.tradeQty.value) || 0;
        const price = STATE.stockData.get(stock.symbol)?.displayPrice || stock.price;
        const net = price * qty;

        const taxes = TaxEngine.calculate('BUY', price, qty);

        this.els.orderVal.innerText = `₹${net.toLocaleString('en-IN')}`;
        this.els.taxStt.innerText = `₹${taxes.stt.toFixed(2)}`;
        this.els.taxStamp.innerText = `₹${taxes.stamp.toFixed(2)}`;
        this.els.taxExch.innerText = `₹${taxes.exch.toFixed(2)}`;
        this.els.taxGst.innerText = `₹${taxes.gst.toFixed(2)}`;
        this.els.tradeTotalEst.innerText = `₹${(net + taxes.total).toLocaleString('en-IN')}`;
    },

    handleTransaction(action) {
        if (!this.isMarketOpen()) {
            this.showToast("Cannot trade while market is closed.", "error");
            return;
        }

        const stock = STATE.currentStock;
        const qty = parseInt(this.els.tradeQty.value);
        if (isNaN(qty) || qty <= 0) return;

        const price = STATE.stockData.get(stock.symbol)?.displayPrice || stock.price;
        const net = price * qty;
        const taxes = TaxEngine.calculate(action, price, qty).total;
        const totalCost = action === 'BUY' ? net + taxes : net - taxes;

        if (action === 'BUY') {
            if (STATE.balance < totalCost) {
                this.showToast("Insufficient Balance!", "error");
                return;
            }
            STATE.balance -= totalCost;
            if (!STATE.portfolio[stock.symbol]) STATE.portfolio[stock.symbol] = { qty: 0, avgCost: 0 };
            const p = STATE.portfolio[stock.symbol];
            p.avgCost = (p.qty * p.avgCost + net) / (p.qty + qty);
            p.qty += qty;
        } else {
            const p = STATE.portfolio[stock.symbol];
            if (!p || p.qty < qty) {
                this.showToast("Insufficient Shares!", "error");
                return;
            }
            STATE.balance += totalCost;
            p.qty -= qty;
            if (p.qty === 0) delete STATE.portfolio[stock.symbol];
        }

        STATE.trades.push({ action, symbol: stock.symbol, qty, price, taxes, time: new Date().toLocaleTimeString() });
        this.persist();
        this.renderPortfolio();
        this.renderActivity();
        this.showToast(`${action} ${qty} shares of ${stock.symbol} successful.`);
    },

    persist() {
        localStorage.setItem('paper_balance', STATE.balance);
        localStorage.setItem('paper_portfolio', JSON.stringify(STATE.portfolio));
        localStorage.setItem('paper_trades', JSON.stringify(STATE.trades));
    },

    renderPortfolio() {
        let invested = 0;
        let costBasisArray = []; // For P&L calc
        let costBasis = 0;

        this.els.holdingsCont.innerHTML = '';
        Object.keys(STATE.portfolio).forEach(sym => {
            const p = STATE.portfolio[sym];
            const currentPrice = STATE.stockData.get(sym)?.displayPrice || 0;
            const value = p.qty * currentPrice;
            invested += value;
            costBasis += p.qty * p.avgCost;

            const div = document.createElement('div');
            div.className = `w-item ${STATE.currentStock?.symbol === sym ? 'active' : ''}`;
            div.onclick = () => this.loadStock(sym);
            const pnl = value - (p.qty * p.avgCost);
            div.innerHTML = `
                <div class="w-top"><span>${sym} (${p.qty})</span><span>${value.toFixed(2)}</span></div>
                <div class="w-bot"><span>Avg: ${p.avgCost.toFixed(1)}</span><span class="${pnl >= 0 ? 'text-green' : 'text-red'}">${pnl >= 0 ? '+' : ''}${pnl.toFixed(1)}</span></div>
            `;
            this.els.holdingsCont.appendChild(div);
        });

        if (Object.keys(STATE.portfolio).length === 0) {
            this.els.holdingsCont.innerHTML = '<div class="placeholder-msg">No active holdings</div>';
        }

        const total = STATE.balance + invested;
        const pnl = invested - costBasis;
        const pnlPct = costBasis > 0 ? (pnl / costBasis * 100).toFixed(2) : "0.00";

        this.els.portCash.innerText = `₹${STATE.balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        this.els.portInvested.innerText = `₹${invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        this.els.portTotal.innerText = `₹${total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        this.els.portPnl.className = `stat-value ${pnl >= 0 ? 'text-green' : 'text-red'}`;
        this.els.portPnl.innerText = `${pnl >= 0 ? '+' : ''}${pnl.toFixed(0)} (${pnlPct}%)`;
    },

    renderWatchlist() {
        this.els.watchlistCont.innerHTML = '';
        STATE.watchlist.forEach(sym => {
            const stock = STATE.stockData.get(sym);
            const div = document.createElement('div');
            div.className = `w-item ${STATE.currentStock?.symbol === sym ? 'active' : ''}`;
            div.onclick = () => { this.loadStock(sym); this.switchTab('tab-analysis'); };
            if (stock) {
                div.innerHTML = `
                    <div class="w-top"><span>${sym}</span><span>${stock.displayPrice.toFixed(2)}</span></div>
                    <div class="w-bot"><span>INR</span><span class="${stock.changePct >= 0 ? 'text-green' : 'text-red'}">${stock.changePct}%</span></div>
                `;
            } else {
                div.innerHTML = `<span>${sym}</span><span style="opacity:0.5">...</span>`;
            }
            this.els.watchlistCont.appendChild(div);
        });
    },

    renderActivity() {
        this.els.activityLog.innerHTML = '';
        [...STATE.trades].reverse().slice(0, 5).forEach(trade => {
            const div = document.createElement('div');
            div.className = 'log-item';
            div.innerHTML = `
                <div><strong>${trade.action}</strong> ${trade.symbol} (${trade.qty})</div>
                <div style="text-align:right">₹${(trade.price * trade.qty).toFixed(0)}<br><span style="font-size:0.6rem; color:var(--danger)">Tax: ₹${trade.taxes.toFixed(0)}</span></div>
            `;
            this.els.activityLog.appendChild(div);
        });
    },

    updateGlobalAI() {
        if (STATE.activeTab === 'tab-overview') {
            this.els.marketAiBox.innerHTML = ActionPlanner.generateMarketAdvice();
        }
    },

    generatePlan() {
        const goal = this.els.planInput.value;
        const stock = STATE.currentStock;
        if (!goal) return;

        this.els.planOutput.innerHTML = '<div class="blink">AI Engine analyzing context and intent...</div>';

        setTimeout(() => {
            const res = ActionPlanner.generate(goal, stock);

            if (res.isGeneral) {
                this.els.planOutput.innerHTML = res.content;
            } else {
                this.els.planOutput.innerHTML = `
                    <div class="ai-response">
                        <div class="strategy-title">${res.action} STRATEGY</div>
                        <p style="font-size:0.9rem; line-height:1.5">${res.reasoning}</p>
                        <div style="margin-top:10px; padding:12px; background:rgba(255,255,255,0.05); border-radius:8px">
                            <span style="font-size:0.75rem; color:var(--text-sec)">TARGET ZONE (BUY):</span> <span style="font-weight:700; font-family:var(--font-mono)">${res.zone}</span>
                        </div>
                        <div class="intent-discovery">${res.followUp}</div>
                    </div>
                `;
            }
        }, 800);
    },

    showToast(msg, type = 'success') {
        const t = this.els.toast;
        t.innerText = msg;
        t.style.borderLeft = `4px solid ${type === 'success' ? 'var(--success)' : 'var(--danger)'}`;
        t.classList.add('show');
        t.classList.remove('hidden');
        setTimeout(() => t.classList.remove('show'), 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => UI.init());
