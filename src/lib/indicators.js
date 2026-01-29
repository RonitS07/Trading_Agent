/**
 * Calculate Simple Moving Average (SMA)
 * @param {Array} data - Array of price objects { time, price } or just numbers
 * @param {number} period - Window size
 * @returns {Array} - Array of { time, value }
 */
export function calculateSMA(data, period) {
    if (!data || data.length < period) return [];

    const sma = [];
    const isObject = typeof data[0] === 'object';

    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += isObject ? (data[i - j].price || data[i - j].close || 0) : data[i - j];
        }
        sma.push({
            time: isObject ? data[i].time : i,
            value: sum / period
        });
    }
    return sma;
}

/**
 * Calculate Exponential Moving Average (EMA)
 * @param {Array} data - Array of price objects
 * @param {number} period - Window size
 * @returns {Array} - Array of { time, value }
 */
export function calculateEMA(data, period) {
    if (!data || data.length < period) return [];

    const isObject = typeof data[0] === 'object';
    const k = 2 / (period + 1);
    const ema = [];

    // First EMA is SMA
    let sum = 0;
    for (let j = 0; j < period; j++) {
        sum += isObject ? (data[j].price || 0) : data[j];
    }
    let prevEma = sum / period;

    ema.push({
        time: isObject ? data[period - 1].time : period - 1,
        value: prevEma
    });

    for (let i = period; i < data.length; i++) {
        const price = isObject ? (data[i].price || 0) : data[i];
        const val = (price * k) + (prevEma * (1 - k));
        ema.push({
            time: isObject ? data[i].time : i,
            value: val
        });
        prevEma = val;
    }

    return ema;
}

/**
 * Calculate RSI
 * @param {Array} data - Array of price objects
 * @param {number} period - Usually 14
 * @returns {Array} - Array of { time, value }
 */
export function calculateRSI(data, period = 14) {
    if (!data || data.length < period + 1) return [];

    const isObject = typeof data[0] === 'object';
    const rsi = [];

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain/loss
    for (let i = 1; i <= period; i++) {
        const curr = isObject ? (data[i].price || 0) : data[i];
        const prev = isObject ? (data[i - 1].price || 0) : data[i - 1];
        const change = curr - prev;

        if (change > 0) gains += change;
        else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < data.length; i++) {
        const curr = isObject ? (data[i].price || 0) : data[i];
        const prev = isObject ? (data[i - 1].price || 0) : data[i - 1];
        const change = curr - prev;

        let gain = change > 0 ? change : 0;
        let loss = change < 0 ? Math.abs(change) : 0;

        avgGain = ((avgGain * (period - 1)) + gain) / period;
        avgLoss = ((avgLoss * (period - 1)) + loss) / period;

        let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        let val = 100 - (100 / (1 + rs));

        rsi.push({
            time: isObject ? data[i].time : i,
            value: val
        });
    }

    return rsi;
}
