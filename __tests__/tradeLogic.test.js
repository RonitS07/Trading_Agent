
// Simplified mock logic for testing purposes
// In a full app with Prisma, we would mock the Prisma client.
// Here we just test the core "Execution Engine" logic functions that we would extract.

const processOrders = (openOrders, currentPrices) => {
    const executed = [];
    openOrders.forEach(order => {
        const price = currentPrices[order.symbol];
        if (!price) return;

        if (order.type === 'LIMIT') {
            if (order.action === 'BUY' && price <= order.limitPrice) {
                executed.push({ ...order, status: 'EXECUTED', execPrice: order.limitPrice });
            } else if (order.action === 'SELL' && price >= order.limitPrice) {
                executed.push({ ...order, status: 'EXECUTED', execPrice: order.limitPrice });
            }
        }
    });
    return executed;
};

describe('Order Execution Logic', () => {
    test('Should execute BUY LIMIT order when price is below limit', () => {
        const orders = [{ id: 1, symbol: 'AAPL', action: 'BUY', type: 'LIMIT', limitPrice: 150 }];
        const prices = { AAPL: 149.50 };
        const result = processOrders(orders, prices);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
    });

    test('Should NOT execute BUY LIMIT order when price is above limit', () => {
        const orders = [{ id: 1, symbol: 'AAPL', action: 'BUY', type: 'LIMIT', limitPrice: 150 }];
        const prices = { AAPL: 150.50 };
        const result = processOrders(orders, prices);
        expect(result).toHaveLength(0);
    });

    test('Should execute SELL LIMIT order when price is above limit', () => {
        const orders = [{ id: 2, symbol: 'GOOGL', action: 'SELL', type: 'LIMIT', limitPrice: 2000 }];
        const prices = { GOOGL: 2005 };
        const result = processOrders(orders, prices);
        expect(result).toHaveLength(1);
    });

    test('Should handle multiple orders correctly in batch', () => {
        const orders = [
            { id: 1, symbol: 'AAPL', action: 'BUY', type: 'LIMIT', limitPrice: 150 },
            { id: 2, symbol: 'AAPL', action: 'SELL', type: 'LIMIT', limitPrice: 160 },
            { id: 3, symbol: 'TSLA', action: 'BUY', type: 'LIMIT', limitPrice: 900 }
        ];
        // AAPL matches BUY, TSLA Too high to buy
        const prices = { AAPL: 140, TSLA: 950 };

        const result = processOrders(orders, prices);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
    });
});
