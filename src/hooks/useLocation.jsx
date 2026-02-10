import { useState, useCallback } from "react";

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

export function useLocation() {
  const [location, setLocationState] = useState(loadLocation);

  const setLocation = useCallback(({ city, country }) => {
    const loc = { city, country };
    saveLocation(loc);
    setLocationState(loc);
  }, []);

  return { location, setLocation, hasLocation: !!location };
}
