"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUSINESS_TZ = void 0;
exports.getBusinessDateString = getBusinessDateString;
exports.parseBusinessDate = parseBusinessDate;
exports.getBusinessDayUtcRange = getBusinessDayUtcRange;
exports.getBusinessMonthStartUtc = getBusinessMonthStartUtc;
exports.BUSINESS_TZ = 'Asia/Kolkata';
function getBusinessDateString(date = new Date()) {
    return date.toLocaleDateString('en-CA', { timeZone: exports.BUSINESS_TZ });
}
function parseBusinessDate(dateStr) {
    const normalized = dateStr.split('T')[0];
    const [y, m, d] = normalized.split('-').map(Number);
    if (!y || !m || !d) {
        throw new Error(`Invalid business date: ${dateStr}`);
    }
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
}
function getBusinessDayUtcRange(dateStr) {
    const d = dateStr || getBusinessDateString();
    const start = new Date(`${d}T00:00:00+05:30`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
}
function getBusinessMonthStartUtc(date = new Date()) {
    const d = getBusinessDateString(date);
    const monthStart = `${d.slice(0, 7)}-01`;
    return new Date(`${monthStart}T00:00:00+05:30`);
}
//# sourceMappingURL=date.util.js.map