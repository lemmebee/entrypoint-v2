export const typeColors = {
  anchor:    { bg: "rgba(34, 139, 34, 0.12)",   border: "#22a845", text: "#22a845" },
  reflect:   { bg: "rgba(234, 179, 8, 0.10)",   border: "#ca8a04", text: "#ca8a04" },
  course:    { bg: "rgba(37, 99, 235, 0.10)",   border: "#2563eb", text: "#2563eb" },
  study:     { bg: "rgba(8, 145, 178, 0.10)",   border: "#0891b2", text: "#0891b2" },
  work:      { bg: "rgba(180, 83, 9, 0.10)",    border: "#b45309", text: "#b45309" },
  project:   { bg: "rgba(124, 58, 237, 0.10)",  border: "#7c3aed", text: "#7c3aed" },
  sport:     { bg: "rgba(220, 38, 38, 0.10)",   border: "#dc2626", text: "#dc2626" },
  therapy:   { bg: "rgba(219, 39, 119, 0.10)",  border: "#db2777", text: "#db2777" },
  rest:      { bg: "rgba(100, 116, 139, 0.08)", border: "#64748b", text: "#64748b" },
  neutral:   { bg: "rgba(163, 163, 163, 0.06)", border: "#a3a3a3", text: "#a3a3a3" },
};

export const DEFAULT_TYPES = Object.keys(typeColors);
export const blockTypes = DEFAULT_TYPES;

export const dayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
export const dayShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const legendItems = [
  { type: "anchor", label: "Anchor" },
  { type: "course", label: "Course" },
  { type: "study", label: "Study" },
  { type: "work", label: "Work" },
  { type: "project", label: "Side Projects" },
  { type: "sport", label: "Sport" },
  { type: "therapy", label: "Therapy / Self" },
  { type: "reflect", label: "Reflection" },
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

export function to12h(time24) {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function minTo12h(min) {
  const h = Math.floor(min / 60) % 24;
  const m = Math.round(min % 60);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export const ANCHOR_NAMES = ["dawn", "midday", "afternoon", "sunset", "night"];

export const SEGMENTS = [
  { id: "pre-dawn", label: "Pre-Dawn" },
  { id: "dawn-midday", label: "Dawn → Midday" },
  { id: "midday-afternoon", label: "Midday → Afternoon" },
  { id: "afternoon-sunset", label: "Afternoon → Sunset" },
  { id: "sunset-night", label: "Sunset → Night" },
  { id: "post-night", label: "Post-Night" },
];

export const PLAN_COLORS = [
  "#2d8a4e", "#0055a4", "#7c3aed", "#b45309",
  "#dc2626", "#db2777", "#0891b2", "#64748b",
];

export const emptyRoutine = () => {
  const routine = {};
  dayKeys.forEach((d) => {
    routine[d] = { blocks: [] };
  });
  return routine;
};
