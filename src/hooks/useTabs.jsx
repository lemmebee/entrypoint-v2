import { useState, useEffect, useCallback } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { emptyDays } from "../utils/constants";

export function useTabs(uid) {
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "users", uid, "tabs"), orderBy("order"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTabs(data);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const createTab = useCallback(
    async (data) => {
      const ref = doc(collection(db, "users", uid, "tabs"));
      await setDoc(ref, {
        label: data.label || "New Phase",
        dates: data.dates || "",
        order: tabs.length,
        days: data.days || emptyDays(),
      });
      return ref.id;
    },
    [uid, tabs.length]
  );

  const updateTab = useCallback(
    async (tabId, data) => {
      await updateDoc(doc(db, "users", uid, "tabs", tabId), data);
    },
    [uid]
  );

  const deleteTab = useCallback(
    async (tabId) => {
      await deleteDoc(doc(db, "users", uid, "tabs", tabId));
    },
    [uid]
  );

  const updateDayBlocks = useCallback(
    async (tabId, dayKey, blocks) => {
      await updateDoc(doc(db, "users", uid, "tabs", tabId), {
        [`days.${dayKey}.blocks`]: blocks,
      });
    },
    [uid]
  );

  return { tabs, loading, createTab, updateTab, deleteTab, updateDayBlocks };
}
