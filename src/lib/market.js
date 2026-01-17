/**
 * Market Logic for Indian Stock Market (NSE/BSE)
 * 
 * Market Hours: 9:15 AM - 3:30 PM IST (GMT+5:30)
 * Open Days: Monday to Friday
 */

export const MARKET_HOLIDAYS_2026 = [
    "2026-01-26", // Republic Day
    "2026-03-06", // Holi
    "2026-03-27", // Ram Navami
    "2026-04-02", // Mahavir Jayanti
    "2026-04-03", // Good Friday
    "2026-04-14", // Dr. Baba Saheb Ambedkar Jayanti
    "2026-05-01", // Maharashtra Day
    "2026-10-02", // Mahatma Gandhi Jayanti
    "2026-10-21", // Dussehra
    "2026-11-12", // Diwali-Laxmi Pujan
    "2026-12-25", // Christmas
];

export function getIndianTime() {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

export function isMarketOpen() {
    const istNow = getIndianTime();
    const day = istNow.getDay(); // 0 = Sun, 6 = Sat
    const hours = istNow.getHours();
    const minutes = istNow.getMinutes();
    const dateString = istNow.toISOString().split('T')[0];

    // 1. Weekend Check
    if (day === 0 || day === 6) {
        return { open: false, reason: "Weekend" };
    }

    // 2. Holiday Check
    if (MARKET_HOLIDAYS_2026.includes(dateString)) {
        return { open: false, reason: "Market Holiday" };
    }

    // 3. Hours Check
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 9 * 60 + 15; // 9:15 AM
    const endMinutes = 15 * 60 + 30;  // 3:30 PM

    if (totalMinutes < startMinutes) {
        return { open: false, reason: "Market opens at 9:15 AM IST" };
    }
    if (totalMinutes >= endMinutes) {
        return { open: false, reason: "Market closed for the day" };
    }

    return { open: true, reason: "Market is Live" };
}
