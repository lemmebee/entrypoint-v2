import { useState, useEffect, useCallback } from "react";
import {
  collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc,
  query, orderBy,
} from "firebase/firestore";
import { firebaseEnabled, db } from "../firebase";

const LOCAL_KEY = "entrypoint-v2-pipelines";

function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function saveLocal(sections) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(sections));
}

// ====== localStorage-backed hook ======
function usePipelinesLocal() {
  const [sections, setSections] = useState(() => loadLocal());

  const persist = useCallback((updater) => {
    setSections((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveLocal(next);
      return next;
    });
  }, []);

  const addSection = useCallback((title) => {
    const id = crypto.randomUUID();
    const section = { id, title: title || "New Section", order: sections.length, collapsed: false, items: [] };
    persist((prev) => [...prev, section]);
    return id;
  }, [persist, sections.length]);

  const updateSection = useCallback((id, data) => {
    persist((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  }, [persist]);

  const deleteSection = useCallback((id) => {
    persist((prev) => prev.filter((s) => s.id !== id));
  }, [persist]);

  const reorderSections = useCallback((reordered) => {
    persist(reordered.map((s, i) => ({ ...s, order: i })));
  }, [persist]);

  const toggleCollapse = useCallback((id) => {
    persist((prev) => prev.map((s) => (s.id === id ? { ...s, collapsed: !s.collapsed } : s)));
  }, [persist]);

  const addItem = useCallback((sectionId, item) => {
    const newItem = { id: crypto.randomUUID(), icon: "🔹", title: "", description: "", ...item };
    persist((prev) => prev.map((s) =>
      s.id === sectionId ? { ...s, items: [...(s.items || []), newItem] } : s
    ));
  }, [persist]);

  const updateItem = useCallback((sectionId, itemId, data) => {
    persist((prev) => prev.map((s) =>
      s.id === sectionId
        ? { ...s, items: (s.items || []).map((it) => (it.id === itemId ? { ...it, ...data } : it)) }
        : s
    ));
  }, [persist]);

  const deleteItem = useCallback((sectionId, itemId) => {
    persist((prev) => prev.map((s) =>
      s.id === sectionId ? { ...s, items: (s.items || []).filter((it) => it.id !== itemId) } : s
    ));
  }, [persist]);

  const mergeSections = useCallback((newSections) => {
    const existingIds = new Set(sections.map((s) => s.id));
    const toAdd = newSections.filter((s) => !existingIds.has(s.id));
    if (toAdd.length === 0) return;
    persist((prev) => [...prev, ...toAdd.map((s, i) => ({ ...s, order: prev.length + i }))]);
  }, [sections, persist]);

  return {
    sections, loading: false,
    addSection, updateSection, deleteSection, reorderSections,
    toggleCollapse, addItem, updateItem, deleteItem, mergeSections,
  };
}

// ====== Firestore-backed hook ======
function usePipelinesFirestore(uid) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    const q = query(collection(db, "users", uid, "pipelines"), orderBy("order"));
    const unsub = onSnapshot(q, (snap) => {
      setSections(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [uid]);

  const addSection = useCallback(async (title) => {
    const id = crypto.randomUUID();
    const section = { id, title: title || "New Section", order: sections.length, collapsed: false, items: [] };
    await setDoc(doc(db, "users", uid, "pipelines", id), section);
    return id;
  }, [uid, sections.length]);

  const updateSection = useCallback(async (id, data) => {
    await updateDoc(doc(db, "users", uid, "pipelines", id), data);
  }, [uid]);

  const deleteSection = useCallback(async (id) => {
    await deleteDoc(doc(db, "users", uid, "pipelines", id));
  }, [uid]);

  const reorderSections = useCallback(async (reordered) => {
    for (let i = 0; i < reordered.length; i++) {
      await updateDoc(doc(db, "users", uid, "pipelines", reordered[i].id), { order: i });
    }
  }, [uid]);

  const toggleCollapse = useCallback(async (id) => {
    const s = sections.find((sec) => sec.id === id);
    if (s) await updateDoc(doc(db, "users", uid, "pipelines", id), { collapsed: !s.collapsed });
  }, [uid, sections]);

  const addItem = useCallback(async (sectionId, item) => {
    const s = sections.find((sec) => sec.id === sectionId);
    if (!s) return;
    const newItem = { id: crypto.randomUUID(), icon: "🔹", title: "", description: "", ...item };
    await updateDoc(doc(db, "users", uid, "pipelines", sectionId), {
      items: [...(s.items || []), newItem],
    });
  }, [uid, sections]);

  const updateItem = useCallback(async (sectionId, itemId, data) => {
    const s = sections.find((sec) => sec.id === sectionId);
    if (!s) return;
    await updateDoc(doc(db, "users", uid, "pipelines", sectionId), {
      items: (s.items || []).map((it) => (it.id === itemId ? { ...it, ...data } : it)),
    });
  }, [uid, sections]);

  const deleteItem = useCallback(async (sectionId, itemId) => {
    const s = sections.find((sec) => sec.id === sectionId);
    if (!s) return;
    await updateDoc(doc(db, "users", uid, "pipelines", sectionId), {
      items: (s.items || []).filter((it) => it.id !== itemId),
    });
  }, [uid, sections]);

  const mergeSections = useCallback(async (newSections) => {
    const existingIds = new Set(sections.map((s) => s.id));
    const toAdd = newSections.filter((s) => !existingIds.has(s.id));
    if (toAdd.length === 0) return;
    for (let i = 0; i < toAdd.length; i++) {
      const s = { ...toAdd[i], order: sections.length + i };
      await setDoc(doc(db, "users", uid, "pipelines", s.id), s);
    }
  }, [uid, sections]);

  return {
    sections, loading,
    addSection, updateSection, deleteSection, reorderSections,
    toggleCollapse, addItem, updateItem, deleteItem, mergeSections,
  };
}

// ====== Exported hook ======
export function usePipelines(uid) {
  if (firebaseEnabled && uid) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return usePipelinesFirestore(uid);
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePipelinesLocal();
}
