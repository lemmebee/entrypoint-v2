import { dayKeys, dayShort } from "../utils/constants";

export default function DaySelector({ selectedDay, onSelect }) {
  return (
    <div className="day-selector">
      {dayKeys.map((d, i) => (
        <button
          key={d}
          className={`day-btn ${selectedDay === d ? "active" : ""}`}
          onClick={() => onSelect(d)}
        >
          {dayShort[i]}
        </button>
      ))}
    </div>
  );
}
