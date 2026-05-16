import { useMemo } from "react";
import { getMonthDates, isDateInRange } from "../utils/dateUtils";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarView({
  viewYear,
  viewMonth,
  selectedDate,
  today,
  plans,
  highlightDate,
  onPrevMonth,
  onNextMonth,
  onGoToday,
  onSelectDate,
  onPlanClick,
}) {
  // Build grid: dates for the month + leading/trailing blanks for alignment
  const grid = useMemo(() => {
    const dates = getMonthDates(viewYear, viewMonth);
    // day-of-week of first day (0=Mon .. 6=Sun)
    const firstDow = (dates[0].date.getDay() + 6) % 7;
    const leading = Array.from({ length: firstDow }, () => null);
    return [...leading, ...dates];
  }, [viewYear, viewMonth]);

  // Map each date to its plan (if any)
  const datePlanMap = useMemo(() => {
    const map = {};
    for (const cell of grid) {
      if (!cell) continue;
      const plan = plans.find((s) =>
        s.startDate && s.endDate && isDateInRange(cell.iso, s.startDate, s.endDate)
      );
      if (plan) map[cell.iso] = plan;
    }
    return map;
  }, [grid, plans]);

  return (
    <div className="calendar-view">
      {/* Month header */}
      <div className="cal-header">
        <button className="cal-nav" onClick={onPrevMonth}>&lsaquo;</button>
        <div className="cal-title">
          <span className="cal-month">{MONTH_NAMES[viewMonth]}</span>
          <span className="cal-year">{viewYear}</span>
        </div>
        <button className="cal-nav" onClick={onNextMonth}>&rsaquo;</button>
        <button className="cal-today-btn" onClick={onGoToday}>Today</button>
      </div>

      {/* Day-of-week headers */}
      <div className="cal-grid">
        {DOW_HEADERS.map((d) => (
          <div key={d} className="cal-dow">{d}</div>
        ))}

        {/* Date cells */}
        {grid.map((cell, i) => {
          if (!cell) return <div key={`blank-${i}`} className="cal-cell cal-blank" />;

          const plan = datePlanMap[cell.iso];
          const isToday = cell.iso === today;
          const isSelected = cell.iso === selectedDate;
          const isHighlight = cell.iso === highlightDate;

          return (
            <button
              key={cell.iso}
              className={`cal-cell ${isToday ? "cal-today" : ""} ${isSelected ? "cal-selected" : ""} ${plan ? "cal-has-plan" : ""} ${isHighlight ? "cal-highlight" : ""}`}
              style={plan ? { "--plan-color": plan.color } : undefined}
              onClick={() => onSelectDate(cell.iso)}
            >
              <span className="cal-day-num">{cell.date.getDate()}</span>
              {plan && <span className="cal-plan-dot" style={{ background: plan.color }} />}
            </button>
          );
        })}
      </div>

      {/* Plan legend below calendar */}
      {plans.length > 0 && (
        <div className="cal-plan-legend">
          {plans.filter((s) => s.startDate && s.endDate).map((s) => (
            <button
              key={s.id}
              className="cal-plan-chip"
              onClick={() => onPlanClick?.(s)}
            >
              <span className="cal-plan-chip-dot" style={{ background: s.color }} />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
