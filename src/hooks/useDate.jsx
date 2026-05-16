import { useState, useCallback } from "react";
import { todayISO } from "../utils/dateUtils";

export function useDate() {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const today = todayISO();

  // View month/year for calendar navigation (independent of selectedDate)
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const goToday = useCallback(() => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDate(todayISO());
  }, []);

  const setViewYearMonth = useCallback((year, month) => {
    setViewYear(year);
    setViewMonth(month);
  }, []);

  return {
    selectedDate,
    setSelectedDate,
    today,
    viewYear, setViewYear,
    viewMonth, setViewMonth,
    prevMonth,
    nextMonth,
    goToday,
    setViewYearMonth,
  };
}
