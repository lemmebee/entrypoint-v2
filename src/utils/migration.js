// Migrate old tab-based data to new plan format
import { PLAN_COLORS } from "./constants";

const CURRENT_YEAR = new Date().getFullYear();

// "Feb 9" or "Feb 9 → Feb 17" → parse month+day
const MONTHS = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseDateStr(str) {
  const match = str.trim().match(/^(\w{3})\s+(\d{1,2})$/);
  if (!match) return null;
  const month = MONTHS[match[1]];
  const day = parseInt(match[2], 10);
  if (month == null || isNaN(day)) return null;
  const d = new Date(CURRENT_YEAR, month, day);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function parseDateRange(datesStr) {
  if (!datesStr) return { startDate: "", endDate: "" };
  // "Feb 9 → Feb 17" or "Feb 18 → Mar 23"
  const parts = datesStr.split(/\u2192|->|–|—/).map((s) => s.trim());
  const start = parseDateStr(parts[0]);
  const end = parts[1] ? parseDateStr(parts[1]) : start;
  return {
    startDate: start || "",
    endDate: end || "",
  };
}

function migrateBlock(oldBlock) {
  return {
    id: oldBlock.id || crypto.randomUUID(),
    activity: oldBlock.activity || "",
    type: oldBlock.type || "neutral",
    icon: oldBlock.icon || "\ud83d\udccc",
    duration: oldBlock.duration || 60,
    segment: null,       // old blocks used absolute time
    offsetMinutes: 0,
    time: oldBlock.time || "08:00",
    tasks: [],
  };
}

function migrateTab(tab, index) {
  const { startDate, endDate } = parseDateRange(tab.dates);

  const routine = {};
  const dayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  for (const key of dayKeys) {
    const dayData = tab.days?.[key];
    routine[key] = {
      blocks: (dayData?.blocks || []).map(migrateBlock),
    };
  }

  return {
    id: tab.id || crypto.randomUUID(),
    label: tab.label || `Plan ${index + 1}`,
    color: PLAN_COLORS[index % PLAN_COLORS.length],
    startDate,
    endDate,
    order: tab.order ?? index,
    routine,
  };
}

/**
 * Migrate old localStorage tabs to new plans format.
 * Returns migrated plans array, or null if no old data found.
 */
export function migrateFromTabs() {
  const OLD_KEY = "entrypoint-v2-tabs";
  const raw = localStorage.getItem(OLD_KEY);
  if (!raw) return null;

  try {
    const tabs = JSON.parse(raw);
    if (!Array.isArray(tabs) || tabs.length === 0) return null;
    return tabs.map(migrateTab);
  } catch {
    return null;
  }
}

/**
 * Check if migration is needed (old data exists, new data doesn't).
 */
export function needsMigration() {
  const hasOld = !!localStorage.getItem("entrypoint-v2-tabs");
  const hasNew = !!localStorage.getItem("entrypoint-v2-plans");
  return hasOld && !hasNew;
}
