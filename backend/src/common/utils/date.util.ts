/** India business timezone — all calendar-day logic uses IST. */
export const BUSINESS_TZ = 'Asia/Kolkata';

/** YYYY-MM-DD in IST (e.g. for display filters and @db.Date equality). */
export function getBusinessDateString(date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: BUSINESS_TZ });
}

/** Parse YYYY-MM-DD for Prisma @db.Date columns (noon UTC avoids boundary shifts). */
export function parseBusinessDate(dateStr: string): Date {
  const normalized = dateStr.split('T')[0];
  const [y, m, d] = normalized.split('-').map(Number);
  if (!y || !m || !d) {
    throw new Error(`Invalid business date: ${dateStr}`);
  }
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
}

/** IST calendar day as UTC instants — for DateTime fields (e.g. issuedAt). */
export function getBusinessDayUtcRange(dateStr?: string): { start: Date; end: Date } {
  const d = dateStr || getBusinessDateString();
  const start = new Date(`${d}T00:00:00+05:30`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

/** First day of the current business month at IST midnight (UTC instant). */
export function getBusinessMonthStartUtc(date = new Date()): Date {
  const d = getBusinessDateString(date);
  const monthStart = `${d.slice(0, 7)}-01`;
  return new Date(`${monthStart}T00:00:00+05:30`);
}
