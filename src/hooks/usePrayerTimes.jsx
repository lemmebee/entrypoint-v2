import { useState, useEffect } from "react";
import { toAladhanDate, todayISO } from "../utils/dateUtils";

const CACHE_KEY = "prayerTimesCache";

function getCached(dateISO) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Cache is keyed by ISO date
    if (data[dateISO]) return data[dateISO];
    return null;
  } catch {
    return null;
  }
}

function setCache(dateISO, times) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[dateISO] = times;
    // Keep max 30 entries to avoid bloat
    const keys = Object.keys(data);
    if (keys.length > 30) {
      keys.sort();
      delete data[keys[0]];
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

/**
 * @param {object} opts
 * @param {string} [opts.date] - ISO date string (defaults to today)
 * @param {string} [opts.city] - City name (defaults to Lyon)
 * @param {string} [opts.country] - Country name (defaults to France)
 * @param {number} [opts.method] - Calculation method (defaults to 12 = UOIF)
 */
export function usePrayerTimes({
  date,
  city = "Lyon",
  country = "France",
  method = 12,
} = {}) {
  const dateISO = date || todayISO();
  const [times, setTimes] = useState(() => getCached(dateISO));
  const [loading, setLoading] = useState(!getCached(dateISO));
  const [error, setError] = useState(null);

  useEffect(() => {
    const cached = getCached(dateISO);
    if (cached) {
      setTimes(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function fetchTimes() {
      try {
        const aladhanDate = toAladhanDate(dateISO);
        const res = await fetch(
          `https://api.aladhan.com/v1/timingsByCity/${aladhanDate}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`
        );
        const json = await res.json();
        if (!cancelled && json.data) {
          const t = json.data.timings;
          const prayerTimes = {
            Fajr: t.Fajr,
            Dhuhr: t.Dhuhr,
            Asr: t.Asr,
            Maghrib: t.Maghrib,
            Isha: t.Isha,
          };
          setTimes(prayerTimes);
          setCache(dateISO, prayerTimes);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTimes();
    return () => { cancelled = true; };
  }, [dateISO, city, country, method]);

  return { times, loading, error };
}
