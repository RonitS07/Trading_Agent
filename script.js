/**
 * TRADEPILOT - NEXT-GEN INDIAN TRADING TERMINAL
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

    activeTab: 'tab-overview',
    // Portfolio History for Charting
    history: JSON.parse(localStorage.getItem('paper_history')) || [
        { time: Date.now() - 3600000 * 5, val: 95000 },
        { time: Date.now() - 3600000 * 4, val: 97500 },
        { time: Date.now() - 3600000 * 3, val: 96000 },
        { time: Date.now() - 3600000 * 2, val: 99000 },
        { time: Date.now() - 3600000 * 1, val: 100000 }
    ],
    // Chat & Stock Data History
    chatHistory: [],
    stockHistory: new Map(), // sym -> { range: data }
    chartRange: '1d'
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
            if (data && data.price !== undefined && !isNaN(data.price)) {
                STATE.stockData.set(sym, {
                    ...data,
                    price: parseFloat(data.price),
                    displayPrice: parseFloat(data.price),
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
            if (!stock || isNaN(stock.displayPrice)) return;

            const change = (Math.random() - 0.5) * (stock.displayPrice * stock.volatility);
            stock.displayPrice += change;

            UI.updateStockDisplay(sym, stock, change > 0);
            if (STATE.currentStock?.symbol === sym) UI.updateMarketSentiment();
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
            "What is your target time horizon? (Intraday / Swing / Long-term)",
            "How much capital are you allocating for this specific paper trade?",
            "Are you looking for a quick scalp or a steady wealth-building entry?",
            "What is your risk tolerance for this simulated position?",
            "Is capital protection your primary goal right now?"
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

        // Emotion Detection
        const isEmotional = goal.includes("panic") || goal.includes("scared") || goal.includes("help") || goal.includes("quick money") || goal.includes("profit fast") || goal.includes("recover");

        if (isEmotional) {
            return {
                isGeneral: true,
                content: `
                    <p><strong>I sense some urgency/emotion in your request.</strong></p>
                    <p>Trading is best done with a calm, disciplined mind. Let's slow down. Before we simulate any trade, what is the core reason for this rush? Strategic entries require waiting for the right setup, not chasing movements.</p>
                    <div class="intent-discovery">Would you like to review a lower-risk strategy for a few days first?</div>
                `
            };
        }

        // 1. Detect Intent: Soft Stock Mention (but not selected)
        if (!stock) {
            const symbols = Array.from(STATE.stockData.keys()).concat(STATE.watchlist);
            const mentioned = symbols.find(s => input.includes(s.split('.')[0]));

            if (mentioned) {
                return {
                    isGeneral: true,
                    content: `
                        <p>${this.getRandom(this.TEMPLATES.OPENINGS)}</p>
                        <p>I noticed you mentioned <strong>${mentioned}</strong>. To provide a high-level strategy including support/resistance zones and momentum signals, please select it from the watchlist.</p>
                        <p>Generally, ${mentioned} follows its sector momentum. Are you planning a delivery or a quick intraday scalp?</p>
                        <div class="intent-discovery">${this.getRandom(this.TEMPLATES.FOLLOW_UPS)}</div>
                    `
                };
            }
        }

        // 2. Detect Intent: General Market Questions
        if (!stock || goal.includes("what to buy") || goal.includes("good stock") || goal.includes("invest in")) {
            return {
                isGeneral: true,
                content: `
                    <p>${this.getRandom(this.TEMPLATES.OPENINGS)}</p>
                    <p>The "Buy" list is always dynamic. Currently, we look for stocks with high relative volume and proximity to 20-day moving averages.</p>
                    <p>Rather than chasing tips, consider scanning for quality mid-caps if you have a 6-month view, or sticking to Blue-chips for stability.</p>
                    <div class="intent-discovery">${this.getRandom(this.TEMPLATES.FOLLOW_UPS)}</div>
                `
            };
        }

        // 3. Stock Specific Analysis (Selected Stock)
        const price = stock.displayPrice || stock.price;
        const change = stock.changePct;

        // Detect Horizon
        let horizon = "SWING";
        if (goal.includes("intraday") || goal.includes("short")) horizon = "INTRADAY";
        if (goal.includes("long") || goal.includes("year") || goal.includes("investment")) horizon = "LONG-TERM";

        const isSellIntent = goal.includes("sell") || goal.includes("exit") || goal.includes("profit") || goal.includes("booking") || goal.includes("sell target");

        let action = "HOLD";
        let reasoning = "";
        let risk = "MEDIUM";
        let zone = "";

        if (isSellIntent) {
            action = "BOOK PROFIT / EXIT";
            risk = "LOW";
            const target = price * 1.05;
            zone = `₹${target.toFixed(2)} - ₹${(target * 1.02).toFixed(2)}`;
            reasoning = `Based on a ${horizon} view, ${stock.symbol} is nearing a historical resistance zone. Locking in gains here aligns with disciplined risk-reward ratios.`;
        } else if (change >= 0 && horizon === "LONG-TERM") {
            action = "ACCUMULATE";
            zone = `₹${(price * 0.98).toFixed(2)} - ₹${price.toFixed(2)}`;
            reasoning = `${stock.symbol} is in a steady uptrend. For wealth-building, partial entries at current levels are strategically sound.`;
        } else if (change < -2 && horizon !== "INTRADAY") {
            action = "BUY ON DIP";
            risk = "MODERATE";
            zone = `₹${(price * 0.97).toFixed(2)} - ₹${(price * 0.99).toFixed(2)}`;
            reasoning = `The recent correction in ${stock.symbol} looks like an opportunity for swing traders. Support is expected near current levels.`;
        } else if (horizon === "INTRADAY") {
            action = change > 0 ? "BULLISH SCALP" : "BEARISH SCALP";
            risk = "HIGH";
            zone = `₹${price.toFixed(2)} +/- 0.5%`;
            reasoning = `Intraday volatility for ${stock.symbol} is high. High-speed execution with strict stop-losses is recommended. No overnight positions.`;
        } else {
            zone = `₹${(price * 0.98).toFixed(2)} - ₹${price.toFixed(2)}`;
            reasoning = `Current setup for ${stock.symbol} is neutral. Waiting for a breakout above recent highs would be a more prudent entry.`;
        }

        return {
            isGeneral: false,
            isSellStrategy: isSellIntent,
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

        marketBadge: document.getElementById('market-status-badge'),
        toast: document.getElementById('toast'),

        // Chatbot Els
        chatHistory: document.getElementById('chat-history'),
        planInput: document.getElementById('plan-input'),
        btnGeneratePlan: document.getElementById('btn-generate-plan'),

        // Chart Els (Portfolio)
        chartPathLine: document.getElementById('chart-path-line'),
        chartPathArea: document.getElementById('chart-path-area'),
        chartTotalVal: document.getElementById('chart-total-val'),
        chartSvg: document.getElementById('portfolio-svg'),
        portfolioChartLabels: document.getElementById('portfolio-chart-labels'),

        // Analysis Chart (Stock)
        stockChartBox: document.getElementById('stock-chart-container'),
        stockChartPath: document.getElementById('stock-path-line'),
        stockChartLabels: document.getElementById('stock-chart-labels'),
        stockChartLoading: document.getElementById('chart-loading'),
        chartRangeBtns: document.querySelectorAll('.chart-rng'),
        chartTooltip: document.getElementById('chart-tooltip'),
        tooltipPrice: document.getElementById('tooltip-price'),
        tooltipTime: document.getElementById('tooltip-time'),
        chartCrosshair: document.getElementById('chart-crosshair'),

        // Intent Actions
        btnIntentBuy: document.getElementById('btn-intent-buy'),
        btnIntentSell: document.getElementById('btn-intent-sell'),
        plannerCard: document.getElementById('planner-card'),
        plannerTitle: document.getElementById('planner-title'),
        btnClosePlanner: document.getElementById('btn-close-planner'),

        // Sentiment Card Els
        sentimentLabel: document.getElementById('sentiment-label'),
        sentimentFillBar: document.getElementById('sentiment-fill-bar'),
        bullPctLabel: document.getElementById('bull-pct'),
        bearPctLabel: document.getElementById('bear-pct'),

        // Security Modal Els
        securityModal: document.getElementById('security-modal'),
        securityPin: document.getElementById('security-pin'),
        btnSecurityConfirm: document.getElementById('btn-security-confirm'),
        btnSecurityCancel: document.getElementById('btn-security-cancel')
    },

    pendingTrade: null,

    init() {
        Ticker.start();
        this.bindEvents();
        this.updateMarketStatus();
        this.renderPortfolio();
        this.renderWatchlist();
        this.renderActivity();
        this.updateChart();
        setInterval(() => this.updateMarketStatus(), 30000);
        setInterval(() => this.snapshotPortfolio(), 60000); // Snapshot once a minute
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
        this.els.btnBuy.onclick = () => this.promptSecurity(STATE.pendingTradeAction || 'BUY');
        this.els.btnSell.onclick = () => this.promptSecurity(STATE.pendingTradeAction || 'SELL');

        // AI Planner
        if (this.els.btnGeneratePlan) this.els.btnGeneratePlan.onclick = () => this.generatePlan();
        if (this.els.planInput) {
            this.els.planInput.onkeydown = (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.generatePlan();
                }
            };
        }

        // Chart Range Selectors
        this.els.chartRangeBtns.forEach(btn => {
            btn.onclick = () => {
                this.els.chartRangeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                STATE.chartRange = btn.dataset.rng;
                this.fetchStockHistory(STATE.currentStock?.symbol, STATE.chartRange);
            };
        });

        // Intent Actions
        this.els.btnIntentBuy.onclick = () => this.openTradePlanner('BUY');
        this.els.btnIntentSell.onclick = () => this.openTradePlanner('SELL');
        this.els.btnClosePlanner.onclick = () => this.closeTradePlanner();

        // Security Modal Events
        this.els.btnSecurityCancel.onclick = () => {
            this.els.securityModal.classList.add('hidden');
            this.pendingTrade = null;
        };
        this.els.btnSecurityConfirm.onclick = () => this.executeAuthorizedTrade();

        // Chart Interactive Events
        this.els.stockChartBox.onmousemove = (e) => this.handleChartHover(e);
        this.els.stockChartBox.onmouseleave = () => this.hideChartTooltip();
    },

    isMarketOpen() {
        return this.getMarketStatus().isOpen;
    },

    promptSecurity(action) {
        if (!this.isMarketOpen()) {
            this.showToast("Cannot trade while market is closed.", "error");
            return;
        }

        const qty = parseInt(this.els.tradeQty.value);
        if (isNaN(qty) || qty <= 0) {
            this.showToast("Enter a valid quantity first!", "error");
            this.els.tradeQty.focus();
            return;
        }

        this.pendingTrade = action;
        this.els.securityPin.value = '';
        this.els.securityModal.classList.remove('hidden');
        this.els.securityPin.focus();
    },

    executeAuthorizedTrade() {
        const pin = this.els.securityPin.value;
        if (pin === '1234') {
            this.els.securityModal.classList.add('hidden');
            this.handleTransaction(this.pendingTrade);
            this.pendingTrade = null;
        } else {
            this.showToast("Invalid Security PIN!", "error");
            this.els.securityPin.value = '';
        }
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

        // Safety check for NaN values from API
        const safePrice = parseFloat(data.price) || 0;
        const safeChange = parseFloat(data.changePct) || 0;

        STATE.currentStock = { ...data, price: safePrice, displayPrice: safePrice, changePct: safeChange };
        STATE.stockData.set(symbol, STATE.currentStock);

        this.updateStockDisplay(symbol, STATE.currentStock);
        this.updateTradePreview();
        this.fetchStockHistory(symbol, STATE.chartRange);
        this.closeTradePlanner();
    },

    async fetchStockHistory(symbol, range = '1d') {
        if (!symbol) return;
        if (this.els.stockChartLoading) this.els.stockChartLoading.classList.remove('hidden');
        try {
            const resp = await fetch(`/api/history?symbol=${symbol}&range=${range}`);
            const data = await resp.json();
            if (data.error) throw new Error(data.error);

            if (!STATE.stockHistory.has(symbol)) STATE.stockHistory.set(symbol, {});
            STATE.stockHistory.get(symbol)[range] = data;

            this.renderStockChart(data);
            this.updateMarketSentiment();
        } catch (e) {
            console.error("History fetch failed:", e);
        } finally {
            if (this.els.stockChartLoading) this.els.stockChartLoading.classList.add('hidden');
        }
    },

    renderStockChart(data) {
        if (!data || data.length < 2) return;
        STATE.activeChartData = data;
        const path = this.els.stockChartPath;
        if (!path) return;

        const width = 600;
        const height = 200;
        const padding = 30; // 5% of width (600) for perfect alignment

        const prices = data.map(d => d.price);
        const minVal = Math.min(...prices);
        const maxVal = Math.max(...prices);
        const valRange = (maxVal - minVal) || 1; // Avoid division by zero

        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
            const y = height - ((d.price - minVal) / valRange) * (height - padding * 2) - padding;
            return { x, y };
        });

        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cx = (prev.x + curr.x) / 2;
            d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
        }

        path.setAttribute('d', d);
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-linecap', 'round');

        // Render Date Labels
        this.renderDateLabels(data);
    },

    renderDateLabels(data) {
        if (!this.els.stockChartLabels) return;
        const range = STATE.chartRange;

        let labelIndices = [];
        if (data.length <= 4) {
            labelIndices = data.map((_, i) => i);
        } else {
            labelIndices = [0, Math.floor(data.length * 0.33), Math.floor(data.length * 0.66), data.length - 1];
        }

        this.els.stockChartLabels.innerHTML = '';
        labelIndices.forEach(idx => {
            const d = data[idx];
            const date = new Date(d.time * 1000); // Yahoo uses seconds
            let label = "";

            if (range === '1d') {
                label = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            } else if (range === '5d') {
                label = `${date.getDate()} ${date.toLocaleString('en-IN', { month: 'short' })} ${date.getHours()}:00`;
            } else if (range === '1mo') {
                label = `${date.getDate()} ${date.toLocaleString('en-IN', { month: 'short' })}`;
            } else {
                label = `${date.toLocaleString('en-IN', { month: 'short' })} '${date.getFullYear().toString().slice(-2)}`;
            }

            const span = document.createElement('span');
            span.innerText = label;
            this.els.stockChartLabels.appendChild(span);
        });
    },

    handleChartHover(e) {
        if (!STATE.activeChartData || STATE.activeChartData.length < 2) return;
        const rect = this.els.stockChartBox.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        const idx = Math.min(
            STATE.activeChartData.length - 1,
            Math.max(0, Math.floor((x / width) * STATE.activeChartData.length))
        );

        const point = STATE.activeChartData[idx];
        if (!point) return;

        // Update Crosshair & Tooltip
        this.els.chartCrosshair.classList.remove('hidden');
        this.els.chartTooltip.classList.remove('hidden');
        this.els.chartCrosshair.style.left = `${x}px`;

        // Adjust tooltip position to avoid overflow
        const tooltipX = x > width - 120 ? x - 130 : x + 10;
        this.els.chartTooltip.style.left = `${tooltipX}px`;

        this.els.tooltipPrice.innerText = `₹${point.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

        // Format time based on range
        const date = new Date(point.time * 1000);
        const range = STATE.chartRange;
        let timeStr = "";

        if (range === '1d') {
            timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        } else if (range === '5d') {
            timeStr = `${date.getDate()} ${date.toLocaleString('en-IN', { month: 'short' })} ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
        } else {
            timeStr = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: '2-digit' });
        }
        this.els.tooltipTime.innerText = timeStr;
    },

    hideChartTooltip() {
        this.els.chartCrosshair.classList.add('hidden');
        this.els.chartTooltip.classList.add('hidden');
    },

    openTradePlanner(action) {
        const stock = STATE.currentStock;
        if (!stock) return;

        STATE.pendingTradeAction = action;
        this.els.plannerTitle.innerText = `${action} ${stock.symbol} - Transaction Sheet`;
        this.els.btnBuy.innerText = `CONFIRM ${action}`;

        // Swap button styles if needed
        this.els.btnBuy.className = action === 'BUY' ? 'btn-buy' : 'btn-sell';
        this.els.btnSell.classList.add('hidden'); // We use one confirm button

        this.els.plannerCard.classList.remove('hidden');
        this.updateTradePreview();
        this.els.tradeQty.focus();
    },

    closeTradePlanner() {
        this.els.plannerCard.classList.add('hidden');
    },

    updateMarketSentiment() {
        const stock = STATE.currentStock;
        if (!stock) return;

        // Simulate sentiment based on price performance & volatility
        const change = parseFloat(stock.changePct) || 0;

        // Base bull score is 50%, offset by change percentage + some randomness for 'live' feel
        let bullScore = 50 + (change * 5) + (Math.random() - 0.5) * 4;
        bullScore = Math.min(Math.max(bullScore, 5), 95); // Clamp between 5 and 95

        const bearScore = 100 - bullScore;

        if (this.els.sentimentFillBar) {
            this.els.sentimentFillBar.style.width = `${bullScore}%`;
        }

        if (this.els.bullPctLabel) this.els.bullPctLabel.innerText = `${bullScore.toFixed(0)}% Bullish`;
        if (this.els.bearPctLabel) this.els.bearPctLabel.innerText = `${bearScore.toFixed(0)}% Bearish`;

        if (this.els.sentimentLabel) {
            const isBullish = bullScore > 50;
            this.els.sentimentLabel.innerText = isBullish ? 'BULLISH' : 'BEARISH';
            this.els.sentimentLabel.className = `s-label ${isBullish ? 'bullish' : 'bearish'}`;
        }
    },

    updateStockDisplay(symbol, stock, isUpTick = null) {
        if (STATE.currentStock?.symbol === symbol) {
            this.els.mainSymbol.innerText = symbol;
            this.els.mainName.innerText = "NSE/BSE Listed Equity";

            // Fixed NaN and Precision
            const price = parseFloat(stock.displayPrice || stock.price) || 0;
            const change = parseFloat(stock.changePct) || 0;

            this.els.mainPrice.innerText = `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            const isPos = change >= 0;
            this.els.mainChange.className = `change-badge ${isPos ? 'up' : 'down'}`;
            this.els.mainChange.innerText = `${isPos ? '+' : ''}${change.toFixed(2)}%`;
            this.els.liveIndicator.classList.remove('hidden');

            this.els.statHigh.innerText = `₹${(price * 1.01).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            this.els.statLow.innerText = `₹${(price * 0.99).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            this.els.statVol.innerText = stock.volume || (Math.random() * 10).toFixed(1) + "M";

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
        const price = STATE.stockData.get(stock.symbol)?.displayPrice || stock.price || 0;
        const net = price * qty;

        const taxes = TaxEngine.calculate(STATE.pendingTradeAction || 'BUY', price, qty);

        this.els.orderVal.innerText = `₹${net.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        this.els.taxStt.innerText = `₹${taxes.stt.toFixed(2)}`;
        this.els.taxStamp.innerText = `₹${taxes.stampDuty.toFixed(2)}`;
        this.els.taxExch.innerText = `₹${taxes.other.toFixed(2)}`;
        this.els.taxGst.innerText = `₹${taxes.gst.toFixed(2)}`;
        this.els.tradeTotalEst.innerText = `₹${(net + taxes.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },

    handleTransaction(action) {
        if (!this.isMarketOpen()) {
            this.showToast("Cannot trade while market is closed.", "error");
            return;
        }

        // Pressure Handling: Quick trade detection (Revenge Trading check)
        const lastTrade = STATE.trades[STATE.trades.length - 1];
        if (lastTrade && (Date.now() - new Date(lastTrade.rawTime).getTime() < 30000)) {
            this.showToast("AI Warning: Rapid trading detected. Take a breath and review your strategy.", "error");
            // We don't block the trade, but we warn the user.
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
            if (p.qty <= 0) delete STATE.portfolio[stock.symbol];
        }

        STATE.trades.push({
            action,
            symbol: stock.symbol,
            qty,
            price,
            taxes,
            time: new Date().toLocaleTimeString(),
            rawTime: new Date().toISOString()
        });
        this.persist();
        this.renderPortfolio();
        this.renderActivity();
        this.showToast(`${action === 'BUY' ? 'Bought' : 'Sold'} ${qty} shares of ${stock.symbol} successful.`);
        this.closeTradePlanner();
    },

    persist() {
        localStorage.setItem('paper_balance', STATE.balance);
        localStorage.setItem('paper_portfolio', JSON.stringify(STATE.portfolio));
        localStorage.setItem('paper_trades', JSON.stringify(STATE.trades));
        localStorage.setItem('paper_history', JSON.stringify(STATE.history));
    },

    snapshotPortfolio() {
        const invested = Object.keys(STATE.portfolio).reduce((acc, sym) => {
            const p = STATE.portfolio[sym];
            const currentPrice = STATE.stockData.get(sym)?.displayPrice || p.avgCost;
            return acc + (p.qty * currentPrice);
        }, 0);
        const total = STATE.balance + invested;

        STATE.history.push({ time: Date.now(), val: total });
        if (STATE.history.length > 50) STATE.history.shift(); // Keep last 50 points
        this.persist();
        this.updateChart();
    },

    updateChart() {
        if (!this.els.chartPathLine || STATE.history.length < 2) return;

        const data = STATE.history;
        const width = 400;
        const height = 150;
        const padding = 20;

        const minVal = Math.min(...data.map(d => d.val)) * 0.999;
        const maxVal = Math.max(...data.map(d => d.val)) * 1.001;
        const valRange = maxVal - minVal;

        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((d.val - minVal) / valRange) * (height - padding * 2) - padding;
            return { x, y };
        });

        // Generate Path (Cubic Bezier for smoothness)
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cx = (prev.x + curr.x) / 2;
            d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
        }

        this.els.chartPathLine.setAttribute('d', d);

        // Area Path
        const areaD = d + ` L ${width} ${height} L 0 ${height} Z`;
        this.els.chartPathArea.setAttribute('d', areaD);

        const lastTotal = data[data.length - 1].val;
        if (this.els.chartTotalVal) {
            this.els.chartTotalVal.innerText = `₹${lastTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        }

        // Update Portfolio Chart Labels
        if (this.els.portfolioChartLabels) {
            this.els.portfolioChartLabels.innerHTML = '';
            const indices = [0, Math.floor(data.length / 3), Math.floor(data.length * 2 / 3), data.length - 1];
            indices.forEach(idx => {
                const rawTime = data[idx].time;
                let label = '--:--';
                if (rawTime) {
                    const date = new Date(rawTime);
                    label = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                }
                const span = document.createElement('span');
                span.innerText = label;
                this.els.portfolioChartLabels.appendChild(span);
            });
        }
    },

    renderPortfolio() {
        let invested = 0;
        let costBasisArray = []; // For P&L calc
        let costBasis = 0;

        this.els.holdingsCont.innerHTML = '';
        Object.keys(STATE.portfolio).forEach(sym => {
            const p = STATE.portfolio[sym];
            const currentPrice = STATE.stockData.get(sym)?.displayPrice || p.avgCost || 0;
            const value = p.qty * currentPrice;
            invested += value;
            costBasis += p.qty * p.avgCost;

            const div = document.createElement('div');
            div.className = `w-item ${STATE.currentStock?.symbol === sym ? 'active' : ''}`;
            div.onclick = () => this.loadStock(sym);
            const pnl = value - (p.qty * p.avgCost);
            div.innerHTML = `
                <div class="w-top"><span>${sym} (${p.qty})</span><span>${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span></div>
                <div class="w-bot"><span>Avg: ${p.avgCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span><span class="${pnl >= 0 ? 'text-green' : 'text-red'}">${pnl >= 0 ? '+' : ''}${pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span></div>
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
        if (this.els.portTotal) this.els.portTotal.innerText = `₹${total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        this.els.portPnl.className = `stat-value ${pnl >= 0 ? 'text-green' : 'text-red'}`;
        this.els.portPnl.innerText = `${pnl >= 0 ? '+' : ''}${pnl.toFixed(0)} (${pnlPct}%)`;

        // Also update chart display stat
        if (this.els.chartTotalVal) {
            this.els.chartTotalVal.innerText = `₹${total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        }
    },

    renderWatchlist() {
        this.els.watchlistCont.innerHTML = '';
        STATE.watchlist.forEach(sym => {
            const stock = STATE.stockData.get(sym);
            const div = document.createElement('div');
            div.className = `w-item ${STATE.currentStock?.symbol === sym ? 'active' : ''}`;
            div.onclick = () => { this.loadStock(sym); this.switchTab('tab-analysis'); };
            if (stock && !isNaN(stock.displayPrice)) {
                div.innerHTML = `
                    <div class="w-top"><span>${sym}</span><span>${stock.displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    <div class="w-bot"><span>INR</span><span class="${stock.changePct >= 0 ? 'text-green' : 'text-red'}">${stock.changePct.toFixed(2)}%</span></div>
                `;
            } else {
                div.innerHTML = `<span>${sym}</span><span style="opacity:0.5">---</span>`;
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
                <div style="text-align:right">₹${(trade.price * trade.qty).toLocaleString('en-IN', { maximumFractionDigits: 0 })}<br><span style="font-size:0.6rem; color:var(--danger)">Tax: ₹${trade.taxes.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span></div>
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
        const input = this.els.planInput.value.trim();
        if (!input) return;

        const stock = STATE.currentStock ? STATE.stockData.get(STATE.currentStock.symbol) : null;
        const res = ActionPlanner.generate(input, stock);

        // Add User Message
        this.addChatMessage('user', input);
        this.els.planInput.value = '';

        // AI Thinking Delay
        setTimeout(() => {
            if (res.isGeneral) {
                this.addChatMessage('ai', `<div class="ai-response">${res.content}</div>`);
            } else {
                const html = `
                    <div class="ai-response">
                        <div class="strategy-title" style="color: ${res.isSellStrategy ? 'var(--accent-red)' : 'var(--accent-green)'}">${res.action} STRATEGY</div>
                        <p>${res.reasoning}</p>
                        <div style="margin-top:10px; padding:12px; background:rgba(255,255,255,0.05); border-radius:8px">
                            <span style="font-size:0.75rem; color:var(--text-sec)">TARGET ZONE (${res.isSellStrategy ? 'SELL' : 'BUY'}):</span> <span style="font-weight:700; font-family:var(--font-mono)">${res.zone}</span>
                        </div>
                        <div class="intent-discovery">${res.followUp}</div>
                    </div>
                `;
                this.addChatMessage('ai', html);
            }
        }, 600);
    },

    addChatMessage(role, content) {
        STATE.chatHistory.push({ role, content });
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${role}`;
        msgDiv.innerHTML = content;
        this.els.chatHistory.appendChild(msgDiv);
        this.els.chatHistory.scrollTop = this.els.chatHistory.scrollHeight;
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
