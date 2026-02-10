// Date helpers for plan/calendar logic

export const dayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/** "2026-02-18" → Date (local midnight) */
export function parseISO(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Date → "2026-02-18" */
export function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Today as ISO string */
export function todayISO() {
  return toISO(new Date());
}

/** "monday", "tuesday", etc. from a Date */
export function getDayKey(date) {
  const idx = (date.getDay() + 6) % 7; // JS Sunday=0, we want Monday=0
  return dayKeys[idx];
}

/** Is date within [startDate, endDate] inclusive? (ISO strings) */
export function isDateInRange(dateISO, startISO, endISO) {
  return dateISO >= startISO && dateISO <= endISO;
}

/** "Feb 18" style short format */
export function formatDateShort(isoStr) {
  const d = parseISO(isoStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "Feb 18 -> Mar 23" range display */
export function formatDateRange(startISO, endISO) {
  return `${formatDateShort(startISO)} \u2192 ${formatDateShort(endISO)}`;
}

/** Aladhan API date format: "DD-MM-YYYY" */
export function toAladhanDate(isoStr) {
  const [y, m, d] = isoStr.split("-");
  return `${d}-${m}-${y}`;
}

/** Add n days to ISO string */
export function addDays(isoStr, n) {
  const d = parseISO(isoStr);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

/** ISO date for a given day-key in the same Mon-Sun week as referenceISO */
export function getWeekDate(referenceISO, targetDayKey) {
  const ref = parseISO(referenceISO);
  const refIdx = (ref.getDay() + 6) % 7; // Monday=0
  const targetIdx = dayKeys.indexOf(targetDayKey);
  const diff = targetIdx - refIdx;
  const d = new Date(ref);
  d.setDate(d.getDate() + diff);
  return toISO(d);
}

/** Get all dates in a month as ISO strings. Returns [{iso, date}] */
export function getMonthDates(year, month) {
  const dates = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    dates.push({ iso: toISO(d), date: new Date(d) });
    d.setDate(d.getDate() + 1);
  }
  return dates;
}
