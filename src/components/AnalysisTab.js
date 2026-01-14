'use client';

import StockChart from './StockChart';
import TradePanel from './TradePanel';

export default function AnalysisTab({ user, symbol, onTradeComplete }) {
    if (!symbol) return <div className="placeholder-msg">Select a stock from the sidebar</div>;

    return (
        <div className="analysis-view">
            <div className="analysis-left">
                <section className="card profile-card">
                    <div className="profile-header">
                        <div className="symbol-info">
                            <h1>{symbol}</h1>
                            <span className="sub-text">NSE Equity</span>
                        </div>
                        <div className="live-badge">LIVE</div>
                    </div>

                    <div className="profile-body">
                        {/* Price is fetched by chart or separate component? We'll rely on chart for visual trend */}
                        <div className="price-hero">
                            <span className="main-price">--</span> {/* Needs live price fetching */}
                        </div>
                    </div>

                    <div className="chart-section">
                        <StockChart symbol={symbol} range="1d" />
                    </div>

                    <TradePanel symbol={symbol} userId={user.id} onTradeComplete={onTradeComplete} />
                </section>
            </div>
        </div>
    );
}
