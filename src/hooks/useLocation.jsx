import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "entrypoint-v2-location";

function loadLocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveLocation(location) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
}

async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
  );
  const data = await res.json();
  const addr = data.address || {};
  const city = addr.city || addr.town || addr.village || addr.county || "Unknown";
  const country = addr.country || "Unknown";
  return { city, country };
}

export function useLocation() {
  const [location, setLocationState] = useState(loadLocation);
  const [detecting, setDetecting] = useState(false);
  const [geoFailed, setGeoFailed] = useState(false);

  const setLocation = useCallback((loc) => {
    saveLocation(loc);
    setLocationState(loc);
    setGeoFailed(false);
  }, []);

  // Auto-detect on first visit
  useEffect(() => {
    if (location) return;
    if (!navigator.geolocation) { setGeoFailed(true); return; }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          const { city, country } = await reverseGeocode(lat, lng);
          const loc = { city, country, lat, lng };
          saveLocation(loc);
          setLocationState(loc);
        } catch {
          setGeoFailed(true);
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setGeoFailed(true);
        setDetecting(false);
      },
      { timeout: 10000 }
    );
  }, [location]);

  return {
    location,
    setLocation,
    hasLocation: !!location,
    detecting,
    geoFailed,
  };
}
