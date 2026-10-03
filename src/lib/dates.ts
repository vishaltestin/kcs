/**
 * India Standard Time helpers.
 *
 * Invoice financial years, meeting days and every "is this today / in the
 * past?" check must be evaluated in IST, not the server's local timezone —
 * a server running in UTC would otherwise roll the financial year over at
 * 05:30 IST on 1 April and treat an evening IST booking as tomorrow.
 *
 * Calendar days are stored the same way everywhere: as UTC midnight of the
 * IST calendar day (what `<input type="date">` sends us).
 */

export const IST_OFFSET_MINUTES = 330; // UTC+05:30
const IST_OFFSET_MS = IST_OFFSET_MINUTES * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** The instant shifted so that UTC getters read IST wall-clock values. */
function shiftToIst(date: Date): Date {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

export type IstParts = {
  year: number;
  /** 1–12 (not the 0-based JS month). */
  month: number;
  day: number;
  hours: number;
  minutes: number;
};

/** Calendar/clock components of an instant as seen in India. */
export function istParts(date: Date = new Date()): IstParts {
  const shifted = shiftToIst(date);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
  };
}

/** "YYYY-MM-DD" for the IST calendar day containing `date`. */
export function istDateKey(date: Date = new Date()): string {
  const { year, month, day } = istParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * UTC midnight of the IST calendar day containing `date` — the canonical
 * value stored for "a day" (meeting dates, report buckets).
 */
export function istDayStart(date: Date = new Date()): Date {
  return parseIstDay(istDateKey(date));
}

/** Parses "YYYY-MM-DD" (an IST calendar day) to UTC midnight. */
export function parseIstDay(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return new Date(NaN);
  return new Date(Date.UTC(y, m - 1, d));
}

/** True when `date` is a valid "YYYY-MM-DD" day. */
export function isValidIstDay(isoDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return false;
  const parsed = parseIstDay(isoDate);
  return !Number.isNaN(parsed.getTime()) && istDateKey(parsed) === isoDate;
}

/** True when the day `isoDate` is today (IST) or later. */
export function isTodayOrFutureIst(isoDate: string): boolean {
  return parseIstDay(isoDate).getTime() >= istDayStart().getTime();
}

/** IST calendar-day comparison: negative/0/positive like a comparator. */
export function compareIstDays(a: Date, b: Date): number {
  return istDayStart(a).getTime() - istDayStart(b).getTime();
}

/**
 * Indian financial year label for a date ("2026-27"), switching on 1 April IST.
 * `financialYear()` with no argument returns the current one.
 */
export function financialYear(date: Date = new Date()): string {
  const { year, month } = istParts(date);
  const startYear = month >= 4 ? year : year - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

/** "DD MMM YYYY" in IST — used on invoices. */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatIstDate(date: Date): string {
  const { year, month, day } = istParts(date);
  return `${String(day).padStart(2, "0")} ${MONTHS[month - 1]} ${year}`;
}

/** Days from today (IST) until `date` — 0 = today, negative = past. */
export function daysUntilIst(date: Date): number {
  return Math.round((istDayStart(date).getTime() - istDayStart().getTime()) / MS_PER_DAY);
}
