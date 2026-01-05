/**
 * TRADEPILOT MOBILE - SPECIALIZED INDEPENDENT LOGIC
 * Engineered for high-speed mobile interactions.
 */

window.MobileUI = {
    els: {
        navButtons: document.querySelectorAll('.m-nav-btn'),
        views: document.querySelectorAll('.m-view'),
        watchlist: document.getElementById('m-watchlist'),
        holdings: document.getElementById('m-holdings'),
        totalValue: document.getElementById('m-total-value'),
        portPnl: document.getElementById('m-port-pnl'),
        portCash: document.getElementById('m-port-cash'),
        mainSymbol: document.getElementById('m-main-symbol'),
        mainPrice: document.getElementById('m-main-price'),
        mainChange: document.getElementById('m-main-change'),
        stockPath: document.getElementById('m-stock-path'),
        stockArea: document.getElementById('m-stock-area'),
        tradeSheet: document.getElementById('m-trade-sheet'),
        tradeQty: document.getElementById('m-trade-qty'),
        tradeTotal: document.getElementById('m-trade-total'),
        previewPrice: document.getElementById('m-preview-price'),
        btnConfirmTrade: document.getElementById('m-btn-confirm-trade'),
        btnCloseSheet: document.getElementById('m-btn-close-sheet'),
        activityLog: document.getElementById('m-activity-log'),
        chatHistory: document.getElementById('m-chat-history'),
        planInput: document.getElementById('m-plan-input'),
        btnSendAi: document.getElementById('m-btn-send-ai'),
        toast: document.getElementById('m-toast')
    },

    init() {
        this.bindEvents();
        setTimeout(() => {
            if (typeof STATE !== 'undefined' && !STATE.currentStock && STATE.watchlist.length > 0) {
                this.selectStock(STATE.watchlist[0]);
            }
        }, 500);
        this.startSync();
        console.log("⚡ Mobile Terminal Primed");
    },

    bindEvents() {
        // Navigation
        this.els.navButtons.forEach(btn => {
            btn.onclick = () => this.switchView(btn.dataset.mview);
        });

        // Trade Sheet logic
        this.els.btnCloseSheet.onclick = () => this.els.tradeSheet.classList.add('hidden');
        this.els.btnConfirmTrade.onclick = () => this.executeTrade();
        this.els.tradeQty.oninput = () => this.updateTradePreview();

        // AI logic
        this.els.btnSendAi.onclick = () => this.handleAiQuery();
        this.els.planInput.onkeydown = (e) => {
            if (e.key === 'Enter') this.handleAiQuery();
        };

        // Close sheet on background click
        this.els.tradeSheet.onclick = (e) => {
            if (e.target === this.els.tradeSheet) this.els.tradeSheet.classList.add('hidden');
        };
    },

    startSync() {
        this.sync();
        setInterval(() => this.sync(), 1000);
    },

    sync() {
        if (typeof STATE === 'undefined') return;

        this.updatePortfolioStats();
        this.renderWatchlist();
        this.renderHoldings();
        this.renderActivity();

        if (STATE.currentStock) {
            this.updateActiveStockUI(STATE.currentStock.symbol, STATE.currentStock);
        }
    },

    switchView(viewId) {
        this.els.views.forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        this.els.navButtons.forEach(b => b.classList.toggle('active', b.dataset.mview === viewId));

        // Haptic feedback simulation
        if (window.navigator.vibrate) window.navigator.vibrate(5);
    },

    updatePortfolioStats() {
        let invested = 0;
        let current = 0;
        Object.keys(STATE.portfolio).forEach(sym => {
            const p = STATE.portfolio[sym];
            const live = STATE.stockData.get(sym) || { price: p.avgCost };
            invested += p.qty * p.avgCost;
            current += p.qty * (live.displayPrice || live.price);
        });

        const total = current + STATE.balance;
        const pnl = total - 100000;
        const pnlPct = (pnl / 100000) * 100;

        this.els.totalValue.innerText = `₹${total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        this.els.portCash.innerText = `₹${(STATE.balance / 1000).toFixed(1)}K`;

        this.els.portPnl.className = `m-pnl-pill ${pnl >= 0 ? 'up' : 'down'}`;
        this.els.portPnl.innerHTML = `<i class="fa-solid fa-caret-${pnl >= 0 ? 'up' : 'down'}"></i><span>${pnl >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%</span>`;

        document.getElementById('m-total-invested').innerText = `₹${invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        document.getElementById('m-port-unrealized').innerText = `₹${(current - invested).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    },

    renderWatchlist() {
        this.els.watchlist.innerHTML = '';
        STATE.watchlist.forEach(sym => {
            const s = STATE.stockData.get(sym);
            if (!s) return;

            const div = document.createElement('div');
            div.className = `m-w-item ${STATE.currentStock?.symbol === sym ? 'active' : ''}`;
            div.onclick = () => this.selectStock(sym);

            div.innerHTML = `
                <div class="m-w-left">
                    <span class="m-w-sym">${sym}</span>
                    <span class="m-w-name">INDIA NSE</span>
                </div>
                <div class="m-w-right">
                    <span class="m-w-price">₹${s.displayPrice.toFixed(2)}</span>
                    <span class="m-w-change ${s.changePct >= 0 ? 'up' : 'down'}">${s.changePct >= 0 ? '+' : ''}${s.changePct.toFixed(2)}%</span>
                </div>
            `;
            this.els.watchlist.appendChild(div);
        });
    },

    selectStock(sym) {
        if (typeof DesktopUI !== 'undefined') DesktopUI.loadStock(sym);
        this.switchView('m-view-analysis');
    },

    updateActiveStockUI(sym, stock) {
        this.els.mainSymbol.innerText = sym;
        this.els.mainPrice.innerText = `₹${stock.displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        this.els.mainChange.innerText = `${stock.changePct >= 0 ? '+' : ''}${stock.changePct.toFixed(2)}%`;
        this.els.mainChange.className = stock.changePct >= 0 ? 'up' : 'down';

        // Update Stats
        document.getElementById('m-day-high').innerText = `₹${(stock.high || stock.price * 1.02).toFixed(2)}`;
        document.getElementById('m-day-low').innerText = `₹${(stock.low || stock.price * 0.98).toFixed(2)}`;

        this.renderChart(sym);
    },

    renderChart(sym) {
        const history = STATE.stockHistory.get(sym)?.[STATE.chartRange];
        if (!history || history.length < 5) return;

        const prices = history.map(h => h.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = (max - min) || 1;

        const points = history.map((h, i) => {
            const x = (i / (history.length - 1)) * 400;
            const y = 180 - ((h.price - min) / range) * 140 - 20;
            return `${x},${y}`;
        });

        const d = `M ${points.join(' L ')}`;
        this.els.stockPath.setAttribute('d', d);
        this.els.stockArea.setAttribute('d', `${d} L 400,180 L 0,180 Z`);

        const isUp = history[history.length - 1].price >= history[0].price;
        const color = isUp ? '#22c55e' : '#ef4444';
        this.els.stockPath.setAttribute('stroke', color);
        document.querySelector('#m-gradient-up stop:first-child').style.stopColor = color;
    },

    openTradeSheet(action) {
        if (!STATE.currentStock) return;
        STATE.pendingTradeAction = action;
        document.getElementById('m-sheet-title').innerText = `${action} ${STATE.currentStock.symbol}`;
        this.els.tradeSheet.classList.remove('hidden');
        this.updateTradePreview();
    },

    adjustQty(delta) {
        const val = Math.max(1, (parseInt(this.els.tradeQty.value) || 1) + delta);
        this.els.tradeQty.value = val;
        this.updateTradePreview();
    },

    updateTradePreview() {
        const qty = parseInt(this.els.tradeQty.value) || 0;
        const price = STATE.currentStock.displayPrice;
        const tax = TaxEngine.calculate(STATE.pendingTradeAction, price, qty).total;
        const total = price * qty + (STATE.pendingTradeAction === 'BUY' ? tax : -tax);

        this.els.previewPrice.innerText = `₹${price.toFixed(2)}`;
        this.els.tradeTotal.innerText = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    },

    executeTrade() {
        const action = STATE.pendingTradeAction;
        if (typeof DesktopUI !== 'undefined') {
            DesktopUI.handleTransaction(action);
        } else {
            // Log fallback if DesktopUI missing but STATE exists
            console.log("Order executed locally", action);
        }
        this.showToast(`${action} Order Executed`);
        this.els.tradeSheet.classList.add('hidden');
    },

    renderHoldings() {
        this.els.holdings.innerHTML = '';
        Object.keys(STATE.portfolio).forEach(sym => {
            const p = STATE.portfolio[sym];
            const s = STATE.stockData.get(sym);
            const livePrice = s ? s.displayPrice : p.avgCost;
            const pnl = (livePrice - p.avgCost) * p.qty;

            const div = document.createElement('div');
            div.className = 'm-w-item';
            div.innerHTML = `
                <div class="m-w-left">
                    <span class="m-w-sym">${sym} • ${p.qty}</span>
                    <span class="m-w-name">Avg: ₹${p.avgCost.toFixed(1)}</span>
                </div>
                <div class="m-w-right">
                    <span class="m-w-price">₹${(livePrice * p.qty).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    <span class="m-w-change ${pnl >= 0 ? 'up' : 'down'}">${pnl >= 0 ? '+' : ''}₹${Math.abs(pnl).toFixed(0)}</span>
                </div>
            `;
            this.els.holdings.appendChild(div);
        });
    },

    renderActivity() {
        this.els.activityLog.innerHTML = '';
        [...STATE.trades].reverse().slice(0, 10).forEach(trade => {
            const div = document.createElement('div');
            div.className = 'm-w-item';
            div.style.padding = '12px 16px';
            div.innerHTML = `
                <div class="m-w-left">
                    <span class="m-w-sym" style="font-size:0.85rem">${trade.action} ${trade.symbol}</span>
                    <span class="m-w-name">${new Date(trade.time).toLocaleTimeString()}</span>
                </div>
                <div class="m-w-right">
                    <span class="m-w-price" style="font-size:0.85rem">₹${(trade.price * trade.qty).toLocaleString('en-IN')}</span>
                </div>
            `;
            this.els.activityLog.appendChild(div);
        });
    },

    handleAiQuery() {
        const query = this.els.planInput.value.trim();
        if (!query) return;

        this.addChatMessage('user', query);
        this.els.planInput.value = '';

        const stock = STATE.currentStock ? STATE.stockData.get(STATE.currentStock.symbol) : null;
        const res = ActionPlanner.generate(query, stock);

        setTimeout(() => {
            const content = res.isGeneral ? res.content : `<strong>${res.action} STRATEGY</strong><br>${res.reasoning}<br><br>Target: ${res.zone}`;
            this.addChatMessage('ai', content);
        }, 800);
    },

    addChatMessage(role, content) {
        const div = document.createElement('div');
        div.className = `chat-msg ${role}`;
        div.innerHTML = content;
        this.els.chatHistory.appendChild(div);
        this.els.chatHistory.scrollTop = this.els.chatHistory.scrollHeight;
    },

    showToast(msg) {
        this.els.toast.innerText = msg;
        this.els.toast.classList.remove('hidden');
        setTimeout(() => this.els.toast.classList.add('hidden'), 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    MobileUI.init();
});
