import { useState, useCallback, useMemo } from "react";
import { typeColors } from "../utils/constants";

const STORAGE_KEY = "entrypoint-v2-custom-types";

// Each color is a unique hue, none overlap with built-in typeColors
// Built-in hues taken: green, gold, blue, cyan, orange, violet, red, pink, slate, gray
const AUTO_PALETTE = [
  "#0d9488", // teal
  "#84cc16", // lime
  "#e11d48", // rose (deeper than pink)
  "#6366f1", // indigo
  "#f97316", // tangerine
  "#06b6d4", // sky
  "#a21caf", // magenta
  "#65a30d", // olive
  "#be185d", // crimson
  "#1d4ed8", // navy
  "#c026d3", // fuchsia
  "#ea580c", // rust
  "#0f766e", // dark teal
  "#4f46e5", // electric indigo
  "#15803d", // forest
  "#9333ea", // purple
];

const BUILTIN_COLORS = new Set(
  Object.values(typeColors).map((v) => v.border.toLowerCase())
);

// Filter palette to only colors not used by built-in types
const AVAILABLE_PALETTE = AUTO_PALETTE.filter(
  (c) => !BUILTIN_COLORS.has(c.toLowerCase())
);

function colorScheme(hex) {
  if (hex.startsWith("hsl")) {
    return { bg: hex.replace(")", ", 0.10)").replace("hsl(", "hsla("), border: hex, text: hex };
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { bg: `rgba(${r}, ${g}, ${b}, 0.10)`, border: hex, text: hex };
}

// Deterministic: type at index i gets AVAILABLE_PALETTE[i], with hue fallback
function colorForIndex(i) {
  if (i < AVAILABLE_PALETTE.length) return AVAILABLE_PALETTE[i];
  const hue = ((i - AVAILABLE_PALETTE.length) * 137.5 + 30) % 360;
  return `hsl(${Math.round(hue)}, 65%, 50%)`;
}

function loadCustomTypes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Only store key + name, strip old color data
    return parsed.map((t) => ({ key: t.key, name: t.name }));
  } catch { return []; }
}

function saveCustomTypes(types) {
  // Only persist key + name — colors are derived
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(types.map((t) => ({ key: t.key, name: t.name })))
  );
}

export function useCustomTypes() {
  const [customTypes, setCustomTypes] = useState(loadCustomTypes);

  // Derive colors from position — always unique by construction
  const enriched = useMemo(() =>
    customTypes.map((t, i) => {
      const color = colorForIndex(i);
      return { ...t, color, colors: colorScheme(color) };
    }),
  [customTypes]);

  const addCustomType = useCallback((name) => {
    const key = name.toLowerCase().replace(/\s+/g, "-");
    setCustomTypes((prev) => {
      if (prev.find((t) => t.key === key)) return prev;
      const next = [...prev, { key, name }];
      saveCustomTypes(next);
      return next;
    });
    return key;
  }, []);

  const removeCustomType = useCallback((key) => {
    setCustomTypes((prev) => {
      const next = prev.filter((t) => t.key !== key);
      saveCustomTypes(next);
      return next;
    });
  }, []);

  const mergeCustomTypes = useCallback((types) => {
    setCustomTypes((prev) => {
      const existingKeys = new Set(prev.map(t => t.key));
      const toAdd = types.filter(t => !existingKeys.has(t.key));
      if (toAdd.length === 0) return prev;
      const next = [...prev, ...toAdd.map(t => ({ key: t.key, name: t.name }))];
      saveCustomTypes(next);
      return next;
    });
  }, []);

  const customTypeColors = useMemo(() =>
    enriched.reduce((acc, t) => { acc[t.key] = t.colors; return acc; }, {}),
  [enriched]);

  return { customTypes: enriched, customTypeColors, addCustomType, removeCustomType, mergeCustomTypes };
}
