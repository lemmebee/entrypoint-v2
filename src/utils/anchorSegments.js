export const SEGMENT_IDS = [
  "pre-dawn",
  "dawn-midday",
  "midday-afternoon",
  "afternoon-sunset",
  "sunset-night",
  "post-night",
];

export const SEGMENT_LABELS = {
  "pre-dawn": "Pre-Dawn",
  "dawn-midday": "Dawn → Midday",
  "midday-afternoon": "Midday → Afternoon",
  "afternoon-sunset": "Afternoon → Sunset",
  "sunset-night": "Sunset → Night",
  "post-night": "Post-Night",
};

function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minToTime(m) {
  m = Math.round(m);
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function computeSegments(times) {
  if (!times) return null;

  const dawn = timeToMin(times.dawn);
  const midday = timeToMin(times.midday);
  const afternoon = timeToMin(times.afternoon);
  const sunset = timeToMin(times.sunset);
  const night = timeToMin(times.night);

  return {
    "pre-dawn": { start: "00:00", end: times.dawn, startMin: 0, endMin: dawn },
    "dawn-midday": { start: times.dawn, end: times.midday, startMin: dawn, endMin: midday },
    "midday-afternoon": { start: times.midday, end: times.afternoon, startMin: midday, endMin: afternoon },
    "afternoon-sunset": { start: times.afternoon, end: times.sunset, startMin: afternoon, endMin: sunset },
    "sunset-night": { start: times.sunset, end: times.night, startMin: sunset, endMin: night },
    "post-night": { start: times.night, end: "23:59", startMin: night, endMin: 23 * 60 + 59 },
  };
}

export function resolveBlockTime(block, segments) {
  if (!block.segment || !segments || !segments[block.segment]) {
    return block.time || "08:00";
  }
  const seg = segments[block.segment];
  const resolved = seg.startMin + (block.offsetMinutes || 0);
  return minToTime(Math.max(0, Math.min(23 * 60 + 55, resolved)));
}
