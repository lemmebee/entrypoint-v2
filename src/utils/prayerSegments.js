// Compute prayer-based time segments from prayer times
// 6 segments: pre-fajr, fajr-dhuhr, dhuhr-asr, asr-maghrib, maghrib-isha, post-isha

export const SEGMENT_IDS = [
  "pre-fajr",
  "fajr-dhuhr",
  "dhuhr-asr",
  "asr-maghrib",
  "maghrib-isha",
  "post-isha",
];

export const SEGMENT_LABELS = {
  "pre-fajr": "Pre-Fajr",
  "fajr-dhuhr": "Fajr \u2192 Dhuhr",
  "dhuhr-asr": "Dhuhr \u2192 Asr",
  "asr-maghrib": "Asr \u2192 Maghrib",
  "maghrib-isha": "Maghrib \u2192 Isha",
  "post-isha": "Post-Isha",
};

function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minToTime(m) {
  m = Math.round(m);
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/**
 * Compute segment boundaries from prayer times.
 * @param {{ Fajr: string, Dhuhr: string, Asr: string, Maghrib: string, Isha: string }} times
 * @returns {{ [segmentId]: { start: string, end: string, startMin: number, endMin: number } }}
 */
export function computeSegments(times) {
  if (!times) return null;

  const fajr = timeToMin(times.Fajr);
  const dhuhr = timeToMin(times.Dhuhr);
  const asr = timeToMin(times.Asr);
  const maghrib = timeToMin(times.Maghrib);
  const isha = timeToMin(times.Isha);

  return {
    "pre-fajr": { start: "00:00", end: times.Fajr, startMin: 0, endMin: fajr },
    "fajr-dhuhr": { start: times.Fajr, end: times.Dhuhr, startMin: fajr, endMin: dhuhr },
    "dhuhr-asr": { start: times.Dhuhr, end: times.Asr, startMin: dhuhr, endMin: asr },
    "asr-maghrib": { start: times.Asr, end: times.Maghrib, startMin: asr, endMin: maghrib },
    "maghrib-isha": { start: times.Maghrib, end: times.Isha, startMin: maghrib, endMin: isha },
    "post-isha": { start: times.Isha, end: "23:59", startMin: isha, endMin: 23 * 60 + 59 },
  };
}

/**
 * Resolve a block's actual start time given prayer segments.
 * If block has segment + offsetMinutes, compute from segment start.
 * If block has time (absolute), use that.
 */
export function resolveBlockTime(block, segments) {
  if (!block.segment || !segments || !segments[block.segment]) {
    return block.time || "08:00";
  }
  const seg = segments[block.segment];
  const resolved = seg.startMin + (block.offsetMinutes || 0);
  return minToTime(Math.max(0, Math.min(23 * 60 + 55, resolved)));
}
