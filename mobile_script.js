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
        totalInvested: document.getElementById('m-total-invested'),
        portUnrealized: document.getElementById('m-port-unrealized'),
        toast: document.getElementById('m-toast'),

        // PIN Modal
        pinModal: document.getElementById('m-pin-modal'),
        pinDots: document.querySelectorAll('.m-pin-dot'),
        btnWatchlistToggle: document.getElementById('m-btn-watchlist-toggle'),

        // Advanced Charting elements
        chartLabels: document.getElementById('m-chart-labels'),
        chartCrosshair: document.getElementById('m-chart-crosshair'),
        chartStage: document.querySelector('.m-chart-stage'),

        // Search специализирован elements
        btnSearch: document.getElementById('m-btn-search'),
        searchOverlay: document.getElementById('m-search-overlay'),
        searchInput: document.getElementById('m-search-input'),
        searchResultList: document.getElementById('m-search-results'),
        btnCloseSearch: document.getElementById('m-btn-close-search-overlay')
    },

    pinBuffer: '',

    init() {
        if (!document.getElementById('m-app-root')) return;
        Ticker.start();
        this.bindEvents();
        setTimeout(() => {
            if (typeof STATE !== 'undefined' && !STATE.currentStock && STATE.watchlist.length > 0) {
                this.selectStock(STATE.watchlist[0]);
            }
        }, 500);
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

        // Search специализирован events
        if (this.els.btnSearch) {
            this.els.btnSearch.onclick = () => {
                this.els.searchOverlay.classList.remove('hidden');
                this.els.searchInput.focus();
            };
        }

        if (this.els.btnCloseSearch) {
            this.els.btnCloseSearch.onclick = () => this.els.searchOverlay.classList.add('hidden');
        }

        let debounce;
        if (this.els.searchInput) {
            this.els.searchInput.addEventListener('input', (e) => {
                clearTimeout(debounce);
                debounce = setTimeout(() => this.handleSearch(e.target.value), 300);
            });
        }

        // Close sheet on background click
        if (this.els.tradeSheet) {
            this.els.tradeSheet.onclick = (e) => {
                if (e.target === this.els.tradeSheet) this.els.tradeSheet.classList.add('hidden');
            };
        }

        // Chart Interactions
        if (this.els.chartStage) {
            this.els.chartStage.addEventListener('touchmove', (e) => this.handleChartMove(e), { passive: false });
            this.els.chartStage.addEventListener('mousemove', (e) => this.handleChartMove(e));
            this.els.chartStage.addEventListener('touchend', () => this.els.chartCrosshair.classList.add('hidden'));
            this.els.chartStage.addEventListener('mouseleave', () => this.els.chartCrosshair.classList.add('hidden'));
        }
    },

    updateMarketSentiment() {
        // Placeholder for consistency across controllers
    },

    updateStockDisplay(sym, stock) {
        if (STATE.currentStock?.symbol === sym) {
            this.updateActiveStockUI(sym, stock);
        }
    },

    sync() {
        if (typeof STATE === 'undefined') return;

        this.renderPortfolio();
        this.renderWatchlist();
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

    renderPortfolio() {
        if (typeof STATE === 'undefined') return;
        let invested = 0;
        let current = 0;
        Object.keys(STATE.portfolio).forEach(sym => {
            const p = STATE.portfolio[sym];
            const live = STATE.stockData.get(sym) || { price: p.avgCost };
            invested += p.qty * p.avgCost;
            current += p.qty * (live.displayPrice || live.price || p.avgCost);
        });

        const total = current + STATE.balance;
        const pnl = total - 100000;
        const pnlPct = (pnl / 100000) * 100;

        if (this.els.totalValue) this.els.totalValue.innerText = `₹${total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        if (this.els.portCash) this.els.portCash.innerText = `₹${(STATE.balance / 1000).toFixed(1)}K`;

        if (this.els.portPnl) {
            this.els.portPnl.className = `m-pnl-pill ${pnl >= 0 ? 'up' : 'down'}`;
            this.els.portPnl.innerHTML = `<i class="fa-solid fa-caret-${pnl >= 0 ? 'up' : 'down'}"></i><span>${pnl >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%</span>`;
        }

        if (this.els.totalInvested) this.els.totalInvested.innerText = `₹${invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        if (this.els.portUnrealized) this.els.portUnrealized.innerText = `₹${(current - invested).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

        this.renderHoldings();
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

    async handleSearch(q) {
        if (!q || q.length < 2) {
            this.els.searchResultList.innerHTML = '';
            return;
        }

        const data = await searchAPI(q);
        this.els.searchResultList.innerHTML = '';

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'm-search-item';
            div.innerHTML = `
                <div class="info">
                    <span class="sym">${item.symbol}</span>
                    <span class="name">${item.shortname}</span>
                </div>
                <div class="exch">${item.exchange}</div>
            `;
            div.onclick = () => {
                this.selectStock(item.symbol);
                this.els.searchOverlay.classList.add('hidden');
                this.els.searchInput.value = '';
                this.els.searchResultList.innerHTML = '';
            };
            this.els.searchResultList.appendChild(div);
        });
    },

    async selectStock(sym) {
        // Load stock data for mobile
        const quote = await getQuote(sym);
        if (!quote) return;

        STATE.currentStock = quote;
        STATE.stockData.set(sym, quote);

        // Fetch history
        const hist = await getHistory(sym, STATE.chartRange);
        if (hist) {
            if (!STATE.stockHistory.has(sym)) STATE.stockHistory.set(sym, {});
            STATE.stockHistory.get(sym)[STATE.chartRange] = hist;
        }

        // Track with ticker
        Ticker.track(sym);

        // Update UI
        this.updateActiveStockUI(sym, quote);
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

        // Update watchlist button state
        this.updateWatchlistButton();

        this.renderChart(sym);
    },

    renderChart(sym) {
        const svgPath = this.els.stockPath;
        const svgArea = this.els.stockArea;

        if (!svgPath || !svgArea) return;

        const history = STATE.stockHistory.get(sym)?.[STATE.chartRange];

        // Show loading state or empty state
        if (!history || history.length < 2) {
            // Draw a flat line as placeholder
            svgPath.setAttribute('d', 'M 0,90 L 400,90');
            svgArea.setAttribute('d', 'M 0,90 L 400,90 L 400,180 L 0,180 Z');
            svgPath.setAttribute('stroke', '#334155');
            svgArea.setAttribute('fill', 'rgba(51, 65, 85, 0.1)');

            if (this.els.chartLabels) {
                this.els.chartLabels.innerHTML = '<span style="opacity:0.5;">Loading chart...</span>';
            }
            return;
        }

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
        svgPath.setAttribute('d', d);
        svgArea.setAttribute('d', `${d} L 400,180 L 0,180 Z`);

        const isUp = history[history.length - 1].price >= history[0].price;
        const color = isUp ? '#22c55e' : '#ef4444';
        svgPath.setAttribute('stroke', color);

        const gradStop = document.querySelector('#m-gradient-up stop:first-child');
        if (gradStop) gradStop.style.stopColor = color;

        // Render Time Labels
        if (this.els.chartLabels) {
            this.els.chartLabels.innerHTML = '';
            const indices = [0, Math.floor(history.length / 2), history.length - 1];
            indices.forEach(idx => {
                const h = history[idx];
                if (h && h.time) {
                    const time = new Date(h.time * 1000);
                    const label = document.createElement('span');
                    label.innerText = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    this.els.chartLabels.appendChild(label);
                }
            });
        }

        STATE.activeMobileChartData = history;
    },

    handleChartMove(e) {
        if (!STATE.activeMobileChartData) return;
        const rect = this.els.chartStage.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const x = clientX - rect.left;
        const width = rect.width;

        if (x < 0 || x > width) {
            this.els.chartCrosshair.classList.add('hidden');
            return;
        }

        const idx = Math.min(
            STATE.activeMobileChartData.length - 1,
            Math.max(0, Math.floor((x / width) * STATE.activeMobileChartData.length))
        );

        const point = STATE.activeMobileChartData[idx];
        this.els.chartCrosshair.classList.remove('hidden');
        this.els.chartCrosshair.style.left = `${x}px`;

        // Update Price Display Temporarily
        if (point) {
            this.els.mainPrice.innerText = `₹${point.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        }

        if (e.cancelable) e.preventDefault();
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
        // Show PIN modal instead of executing directly
        this.els.tradeSheet.classList.add('hidden');
        this.els.pinModal.classList.remove('hidden');
        this.pinBuffer = '';
        this.updatePINDisplay();
    },

    enterPIN(digit) {
        if (this.pinBuffer.length < 4) {
            this.pinBuffer += digit;
            this.updatePINDisplay();

            if (this.pinBuffer.length === 4) {
                setTimeout(() => this.verifyPIN(), 300);
            }
        }
    },

    clearPIN() {
        this.pinBuffer = this.pinBuffer.slice(0, -1);
        this.updatePINDisplay();
    },

    cancelPIN() {
        this.els.pinModal.classList.add('hidden');
        this.pinBuffer = '';
    },

    updatePINDisplay() {
        this.els.pinDots.forEach((dot, i) => {
            dot.classList.toggle('filled', i < this.pinBuffer.length);
        });
    },

    verifyPIN() {
        if (this.pinBuffer === '1234') {
            this.els.pinModal.classList.add('hidden');
            this.processTransaction();
        } else {
            this.pinBuffer = '';
            this.updatePINDisplay();
            this.showToast('❌ Incorrect PIN');
        }
    },

    processTransaction() {
        const action = STATE.pendingTradeAction;
        const symbol = STATE.currentStock.symbol;
        const qty = parseInt(this.els.tradeQty.value) || 0;
        const price = STATE.currentStock.displayPrice;

        if (qty <= 0) return;

        // Standalone Mobile Transaction Logic
        const taxData = TaxEngine.calculate(action, price, qty);
        const total = price * qty + (action === 'BUY' ? taxData.total : -taxData.total);

        if (action === 'BUY') {
            if (STATE.balance < total) {
                this.showToast("Insufficient Balance");
                return;
            }
            STATE.balance -= total;
            const p = STATE.portfolio[symbol] || { qty: 0, avgCost: 0 };
            const newQty = p.qty + qty;
            const newAvg = (p.qty * p.avgCost + qty * price) / newQty;
            STATE.portfolio[symbol] = { qty: newQty, avgCost: newAvg };
        } else {
            const p = STATE.portfolio[symbol];
            if (!p || p.qty < qty) {
                this.showToast("Insufficient Holdings");
                return;
            }
            STATE.balance += total;
            p.qty -= qty;
            if (p.qty <= 0) delete STATE.portfolio[symbol];
        }

        // Record Trade
        STATE.trades.push({
            id: Date.now(),
            symbol,
            action,
            qty,
            price,
            tax: taxData.total,
            time: new Date().toISOString()
        });

        this.showToast(`${action} Successful: ${symbol}`);
        this.els.tradeSheet.classList.add('hidden');
        this.sync();
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

    toggleWatchlist() {
        if (!STATE.currentStock) return;
        const sym = STATE.currentStock.symbol;
        const idx = STATE.watchlist.indexOf(sym);

        if (idx > -1) {
            STATE.watchlist.splice(idx, 1);
            this.showToast(`Removed ${sym} from watchlist`);
        } else {
            STATE.watchlist.push(sym);
            this.showToast(`Added ${sym} to watchlist`);
        }

        localStorage.setItem('watchlist', JSON.stringify(STATE.watchlist));
        this.updateWatchlistButton();
        this.renderWatchlist();
    },

    updateWatchlistButton() {
        if (!STATE.currentStock || !this.els.btnWatchlistToggle) return;
        const isInWatchlist = STATE.watchlist.includes(STATE.currentStock.symbol);
        this.els.btnWatchlistToggle.classList.toggle('active', isInWatchlist);
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
