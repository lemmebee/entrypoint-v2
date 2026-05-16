import { useState, useEffect } from "react";
import { toApiDateDMY, todayISO } from "../utils/dateUtils";

const CACHE_KEY = "timeAnchorsCache";

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
    const keys = Object.keys(data);
    if (keys.length > 30) {
      keys.sort();
      delete data[keys[0]];
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function useAnchorTimes({
  date,
  city = "Lyon",
  country = "France",
  lat,
  lng,
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
        const apiDate = toApiDateDMY(dateISO);
        let url;
        if (lat != null && lng != null) {
          url = `https://api.aladhan.com/v1/timings/${apiDate}?latitude=${lat}&longitude=${lng}`;
        } else {
          const address = `${city},${country}`;
          url = `https://api.aladhan.com/v1/timingsByAddress/${apiDate}?address=${encodeURIComponent(address)}`;
        }
        const res = await fetch(url);
        const json = await res.json();
        if (!cancelled && json.data) {
          const t = json.data.timings;
          const anchorTimes = {
            dawn: t.Fajr,
            midday: t.Dhuhr,
            afternoon: t.Asr,
            sunset: t.Maghrib,
            night: t.Isha,
          };
          setTimes(anchorTimes);
          setCache(dateISO, city, country, anchorTimes);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTimes();
    return () => { cancelled = true; };
  }, [dateISO, city, country, lat, lng]);

  return { times, loading, error };
}
