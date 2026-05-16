import { useState, useCallback } from "react";
import { defaultTabs } from "../utils/defaultSchedule";

// ──────────────────────────────────────────────
// LOCAL STATE + localStorage persistence
// Every mutation writes to localStorage immediately (no useEffect race)
// To switch to Firestore: replace saveTabs/loadTabs with Firestore calls
// ──────────────────────────────────────────────

const STORAGE_KEY = "entrypoint-v2-tabs";

function loadTabs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore corrupt data */ }
  return defaultTabs.map((t, i) => ({ ...t, id: `tab-${i}` }));
}

function saveTabs(tabs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
}

// ensure every block has an explicit duration so adding new blocks doesn't shift others
function normalizeDurations(tabs) {
  let changed = false;
  const out = tabs.map((tab) => {
    const days = { ...tab.days };
    for (const dayKey of Object.keys(days)) {
      const day = days[dayKey];
      if (!day?.blocks?.length) continue;
      const sorted = [...day.blocks].sort((a, b) => {
        const am = a.time.split(":").map(Number);
        const bm = b.time.split(":").map(Number);
        return (am[0] * 60 + am[1]) - (bm[0] * 60 + bm[1]);
      });
      const blocks = sorted.map((b, i) => {
        if (b.duration) return b;
        changed = true;
        const [h, m] = b.time.split(":").map(Number);
        const start = h * 60 + m;
        const dur = i < sorted.length - 1
          ? Math.max((() => { const [nh, nm] = sorted[i + 1].time.split(":").map(Number); return nh * 60 + nm; })() - start, 15)
          : 60;
        return { ...b, duration: dur };
      });
      if (changed) days[dayKey] = { ...day, blocks };
    }
    return changed ? { ...tab, days } : tab;
  });
  return { tabs: out, changed };
}

// load once at module level so every useState reads the same reference
const loaded = loadTabs();
const { tabs: initialTabs, changed: needsSave } = normalizeDurations(loaded);
if (needsSave) saveTabs(initialTabs);

export function useSchedule() {
  const [tabs, setTabs] = useState(initialTabs);
  const [activeTabId, setActiveTabId] = useState(initialTabs[0]?.id || null);
  const [selectedDay, setSelectedDay] = useState("monday");

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0] || null;

  // auto-sync activeTabId when tabs change
  if (activeTab && activeTabId !== activeTab.id) {
    setActiveTabId(activeTab.id);
  }

  // wrapper: set state + persist in one shot
  const persistTabs = useCallback((updater) => {
    setTabs((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveTabs(next);
      return next;
    });
  }, []);

  const createTab = useCallback((data) => {
    const id = crypto.randomUUID();
    persistTabs((prev) => [...prev, { ...data, id, order: prev.length }]);
    setActiveTabId(id);
    return id;
  }, [persistTabs]);

  const updateTab = useCallback((tabId, data) => {
    persistTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, ...data } : t))
    );
  }, [persistTabs]);

  const deleteTab = useCallback(
    (tabId) => {
      persistTabs((prev) => prev.filter((t) => t.id !== tabId));
      if (activeTabId === tabId) setActiveTabId(null);
    },
    [activeTabId, persistTabs]
  );

  const updateDayBlocks = useCallback(
    (dayKey, blocks) => {
      if (!activeTab) return;
      persistTabs((prev) =>
        prev.map((t) =>
          t.id === activeTab.id
            ? { ...t, days: { ...t.days, [dayKey]: { ...t.days[dayKey], blocks } } }
            : t
        )
      );
    },
    [activeTab, persistTabs]
  );

  const seedDefaults = useCallback(() => {
    const seeded = defaultTabs.map((t, i) => ({ ...t, id: `tab-${i}` }));
    persistTabs(seeded);
    setActiveTabId(seeded[0]?.id || null);
  }, [persistTabs]);

  const exportJSON = useCallback(() => {
    const data = tabs.map(({ id, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "entrypoint-v2-schedule.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [tabs]);

  const importJSON = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data) || data.length === 0) throw new Error("Expected non-empty array of tabs");
        const imported = data.map((t) => ({ ...t, id: t.id || crypto.randomUUID() }));
        // save to localStorage and reload — eliminates all React state race conditions
        saveTabs(imported);
        window.location.reload();
      } catch (err) {
        alert("Invalid schedule file: " + err.message);
      }
    };
    reader.readAsText(file);
  }, []);

  return {
    tabs,
    activeTab,
    activeTabId,
    selectedDay,
    setActiveTabId,
    setSelectedDay,
    createTab,
    updateTab,
    deleteTab,
    updateDayBlocks,
    seedDefaults,
    exportJSON,
    importJSON,
  };
}
