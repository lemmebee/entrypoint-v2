export const typeColors = {
  prayer:    { bg: "rgba(34, 139, 34, 0.12)",   border: "#22a845", text: "#22a845" },   // green
  spiritual: { bg: "rgba(234, 179, 8, 0.10)",   border: "#ca8a04", text: "#ca8a04" },   // gold
  course:    { bg: "rgba(37, 99, 235, 0.10)",   border: "#2563eb", text: "#2563eb" },   // blue
  study:     { bg: "rgba(8, 145, 178, 0.10)",   border: "#0891b2", text: "#0891b2" },   // cyan
  work:      { bg: "rgba(180, 83, 9, 0.10)",    border: "#b45309", text: "#b45309" },   // orange
  project:   { bg: "rgba(124, 58, 237, 0.10)",  border: "#7c3aed", text: "#7c3aed" },  // violet
  sport:     { bg: "rgba(220, 38, 38, 0.10)",   border: "#dc2626", text: "#dc2626" },   // red
  therapy:   { bg: "rgba(219, 39, 119, 0.10)",  border: "#db2777", text: "#db2777" },  // pink
  rest:      { bg: "rgba(100, 116, 139, 0.08)", border: "#64748b", text: "#64748b" },  // slate
  neutral:   { bg: "rgba(163, 163, 163, 0.06)", border: "#a3a3a3", text: "#a3a3a3" },  // gray
};

export const DEFAULT_TYPES = Object.keys(typeColors);
export const blockTypes = DEFAULT_TYPES;

export const dayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
export const dayShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const legendItems = [
  { type: "prayer", label: "Prayer + Quran" },
  { type: "course", label: "French Course" },
  { type: "study", label: "French Study" },
  { type: "work", label: "Job Search" },
  { type: "project", label: "Side Projects" },
  { type: "sport", label: "Sport" },
  { type: "therapy", label: "Therapy / Self" },
  { type: "spiritual", label: "Islamic" },
  { type: "rest", label: "Rest / Free" },
];

export const emptyWeek = () => {
  const week = {};
  dayKeys.forEach((d, i) => {
    week[d] = { label: dayShort[i].length === 3 ? ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][i] : d, blocks: [] };
  });
  return week;
};

export const emptyDays = () => {
  const days = {};
  const fullNames = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  dayKeys.forEach((d, i) => {
    days[d] = { label: fullNames[i], blocks: [] };
  });
  return days;
};

// 24h "HH:MM" → 12h "h:MM AM/PM"
export function to12h(time24) {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

// minutes → 12h "h:MM AM/PM"
export function minTo12h(min) {
  const h = Math.floor(min / 60) % 24;
  const m = Math.round(min % 60);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

// Prayer segment constants
export const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

export const SEGMENTS = [
  { id: "pre-fajr", label: "Pre-Fajr" },
  { id: "fajr-dhuhr", label: "Fajr \u2192 Dhuhr" },
  { id: "dhuhr-asr", label: "Dhuhr \u2192 Asr" },
  { id: "asr-maghrib", label: "Asr \u2192 Maghrib" },
  { id: "maghrib-isha", label: "Maghrib \u2192 Isha" },
  { id: "post-isha", label: "Post-Isha" },
];

// Plan color presets
export const PLAN_COLORS = [
  "#2d8a4e", "#0055a4", "#7c3aed", "#b45309",
  "#dc2626", "#db2777", "#0891b2", "#64748b",
];

// Empty routine (7-day template)
export const emptyRoutine = () => {
  const routine = {};
  dayKeys.forEach((d) => {
    routine[d] = { blocks: [] };
  });
  return routine;
};
