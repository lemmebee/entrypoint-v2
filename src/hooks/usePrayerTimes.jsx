import { useState, useEffect } from "react";
import { toAladhanDate, todayISO } from "../utils/dateUtils";

const CACHE_KEY = "prayerTimesCache";

function cacheKey(dateISO, city, country) {
  return `${dateISO}|${city}|${country}`;
}

function getCached(dateISO, city, country) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data[cacheKey(dateISO, city, country)] || null;
  } catch {
    return null;
  }
}

function setCache(dateISO, city, country, times) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[cacheKey(dateISO, city, country)] = times;
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
 */
export function usePrayerTimes({
  date,
  city = "Lyon",
  country = "France",
} = {}) {
  const dateISO = date || todayISO();
  const [times, setTimes] = useState(() => getCached(dateISO, city, country));
  const [loading, setLoading] = useState(!getCached(dateISO, city, country));
  const [error, setError] = useState(null);

  useEffect(() => {
    const cached = getCached(dateISO, city, country);
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
        const address = `${city},${country}`;
        const res = await fetch(
          `https://api.aladhan.com/v1/timingsByAddress/${aladhanDate}?address=${encodeURIComponent(address)}`
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
          setCache(dateISO, city, country, prayerTimes);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTimes();
    return () => { cancelled = true; };
  }, [dateISO, city, country]);

  return { times, loading, error };
}
