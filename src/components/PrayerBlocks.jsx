// Generates computed prayer block objects from prayer times
// These are NOT stored — injected at render time as immovable blocks

const PRAYER_DURATION = 25; // minutes display height

/**
 * Generate prayer block objects from prayer times.
 * @param {{ Fajr: string, Dhuhr: string, Asr: string, Maghrib: string, Isha: string }} times
 * @returns {Array} Array of block objects with isPrayer=true
 */
export function generatePrayerBlocks(times) {
  if (!times) return [];

  return [
    { id: "prayer-fajr", time: times.Fajr, activity: "Fajr", type: "prayer", icon: "\ud83d\udd4c", duration: PRAYER_DURATION, isPrayer: true },
    { id: "prayer-dhuhr", time: times.Dhuhr, activity: "Dhuhr", type: "prayer", icon: "\ud83d\udd4c", duration: PRAYER_DURATION, isPrayer: true },
    { id: "prayer-asr", time: times.Asr, activity: "Asr", type: "prayer", icon: "\ud83d\udd4c", duration: PRAYER_DURATION, isPrayer: true },
    { id: "prayer-maghrib", time: times.Maghrib, activity: "Maghrib", type: "prayer", icon: "\ud83d\udd4c", duration: PRAYER_DURATION, isPrayer: true },
    { id: "prayer-isha", time: times.Isha, activity: "Isha", type: "prayer", icon: "\ud83d\udd4c", duration: PRAYER_DURATION, isPrayer: true },
  ];
}
