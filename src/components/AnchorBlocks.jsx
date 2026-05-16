const ANCHOR_DURATION = 25;

const ANCHOR_LABELS = {
  dawn: "Dawn",
  midday: "Midday",
  afternoon: "Afternoon",
  sunset: "Sunset",
  night: "Night",
};

export function generateAnchorBlocks(times) {
  if (!times) return [];

  return ["dawn", "midday", "afternoon", "sunset", "night"].map((key) => ({
    id: `anchor-${key}`,
    time: times[key],
    activity: ANCHOR_LABELS[key],
    type: "anchor",
    icon: "☀️",
    duration: ANCHOR_DURATION,
    isAnchor: true,
  }));
}
