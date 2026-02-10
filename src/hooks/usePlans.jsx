import { useState, useEffect, useCallback } from "react";
import {
  collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, writeBatch,
  query, orderBy,
} from "firebase/firestore";
import { firebaseEnabled, db } from "../firebase";
import { emptyRoutine, PLAN_COLORS } from "../utils/constants";
import { isDateInRange } from "../utils/dateUtils";
import { migrateFromTabs, needsMigration } from "../utils/migration";

const LOCAL_KEY = "entrypoint-v2-plans";
const OLD_TABS_KEY = "entrypoint-v2-tabs";

// --- localStorage helpers ---
function loadLocal() {
  if (needsMigration()) {
    const migrated = migrateFromTabs();
    if (migrated) {
      saveLocal(migrated);
      return migrated;
    }
  }
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function saveLocal(plans) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(plans));
}

// --- Firestore migration ---
async function migrateLocalToFirestore(uid) {
  const flag = `entrypoint-v2-migrated-${uid}`;
  if (localStorage.getItem(flag)) return;

  let local = null;
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) local = parsed;
    }
  } catch { /* ignore */ }

  if (local && local.length > 0) {
    const batch = writeBatch(db);
    for (const s of local) {
      batch.set(doc(db, "users", uid, "plans", s.id), { ...s });
    }
    await batch.commit();
  }

  localStorage.setItem(flag, "1");
  localStorage.removeItem(LOCAL_KEY);
  localStorage.removeItem(OLD_TABS_KEY);
}

// ====== localStorage-backed hook (no auth) ======
function usePlansLocal() {
  const [plans, setPlans] = useState(() => loadLocal());
  const [activePlanId, setActivePlanId] = useState(() => loadLocal()[0]?.id || null);

  const activePlan = plans.find((s) => s.id === activePlanId) || plans[0] || null;
  if (activePlan && activePlanId !== activePlan.id) {
    setActivePlanId(activePlan.id);
  }

  const persist = useCallback((updater) => {
    setPlans((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveLocal(next);
      return next;
    });
  }, []);

  const createPlan = useCallback((data) => {
    const id = crypto.randomUUID();
    const plan = {
      id,
      label: data.label || "New Plan",
      color: data.color || PLAN_COLORS[0],
      startDate: data.startDate || "",
      endDate: data.endDate || "",
      order: data.order ?? plans.length,
      routine: data.routine || emptyRoutine(),
    };
    persist((prev) => [...prev, plan]);
    setActivePlanId(id);
    return id;
  }, [persist, plans.length]);

  const updatePlan = useCallback((planId, data) => {
    persist((prev) => prev.map((s) => (s.id === planId ? { ...s, ...data } : s)));
  }, [persist]);

  const deletePlan = useCallback((planId) => {
    persist((prev) => prev.filter((s) => s.id !== planId));
    if (activePlanId === planId) setActivePlanId(null);
  }, [activePlanId, persist]);

  const updateRoutineBlocks = useCallback((planId, dayKey, blocks) => {
    const targetId = planId || activePlan?.id;
    if (!targetId) return;
    persist((prev) =>
      prev.map((s) =>
        s.id === targetId
          ? { ...s, routine: { ...s.routine, [dayKey]: { ...s.routine[dayKey], blocks } } }
          : s
      )
    );
  }, [activePlan, persist]);

  const getPlanForDate = useCallback((dateISO) => {
    return plans.find((s) =>
      s.startDate && s.endDate && isDateInRange(dateISO, s.startDate, s.endDate)
    ) || null;
  }, [plans]);

  const mergePlans = useCallback((newPlans) => {
    const existingIds = new Set(plans.map(p => p.id));
    const toAdd = newPlans.filter(p => !existingIds.has(p.id));
    if (toAdd.length === 0) return;
    persist(prev => [...prev, ...toAdd.map((p, i) => ({ ...p, order: prev.length + i }))]);
  }, [plans, persist]);

  return {
    plans, loading: false, activePlan, activePlanId, setActivePlanId,
    createPlan, updatePlan, deletePlan, updateRoutineBlocks,
    getPlanForDate, mergePlans,
  };
}

// ====== Firestore-backed hook (with auth) ======
function usePlansFirestore(uid) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePlanId, setActivePlanId] = useState(null);

  const activePlan = plans.find((s) => s.id === activePlanId) || plans[0] || null;
  if (activePlan && activePlanId !== activePlan.id) {
    setActivePlanId(activePlan.id);
  }

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    migrateLocalToFirestore(uid).catch(() => {});
    const q = query(collection(db, "users", uid, "plans"), orderBy("order"));
    const unsub = onSnapshot(q, (snap) => {
      setPlans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [uid]);

  useEffect(() => {
    if (plans.length > 0 && !activePlanId) setActivePlanId(plans[0].id);
  }, [plans, activePlanId]);

  const createPlan = useCallback(async (data) => {
    const id = crypto.randomUUID();
    const plan = {
      id,
      label: data.label || "New Plan",
      color: data.color || PLAN_COLORS[0],
      startDate: data.startDate || "",
      endDate: data.endDate || "",
      order: data.order ?? plans.length,
      routine: data.routine || emptyRoutine(),
    };
    await setDoc(doc(db, "users", uid, "plans", id), plan);
    setActivePlanId(id);
    return id;
  }, [uid, plans.length]);

  const updatePlan = useCallback(async (planId, data) => {
    await updateDoc(doc(db, "users", uid, "plans", planId), data);
  }, [uid]);

  const deletePlan = useCallback(async (planId) => {
    await deleteDoc(doc(db, "users", uid, "plans", planId));
    if (activePlanId === planId) setActivePlanId(null);
  }, [uid, activePlanId]);

  const updateRoutineBlocks = useCallback(async (planId, dayKey, blocks) => {
    const targetId = planId || activePlan?.id;
    if (!targetId) return;
    await updateDoc(doc(db, "users", uid, "plans", targetId), {
      [`routine.${dayKey}.blocks`]: blocks,
    });
  }, [uid, activePlan]);

  const getPlanForDate = useCallback((dateISO) => {
    return plans.find((s) =>
      s.startDate && s.endDate && dateISO >= s.startDate && dateISO <= s.endDate
    ) || null;
  }, [plans]);

  const mergePlans = useCallback(async (newPlans) => {
    const existingIds = new Set(plans.map(p => p.id));
    const toAdd = newPlans.filter(p => !existingIds.has(p.id));
    if (toAdd.length === 0) return;
    const batch = writeBatch(db);
    toAdd.forEach((p, i) => {
      const plan = { ...p, order: plans.length + i };
      batch.set(doc(db, "users", uid, "plans", plan.id), plan);
    });
    await batch.commit();
  }, [uid, plans]);

  return {
    plans, loading, activePlan, activePlanId, setActivePlanId,
    createPlan, updatePlan, deletePlan, updateRoutineBlocks,
    getPlanForDate, mergePlans,
  };
}

// ====== Exported hook — picks backend based on config ======
export function usePlans(uid) {
  if (firebaseEnabled && uid) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return usePlansFirestore(uid);
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePlansLocal();
}
