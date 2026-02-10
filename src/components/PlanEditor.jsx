import { useState } from "react";
import { PLAN_COLORS } from "../utils/constants";

function hasOverlap(start, end, plans, excludeId) {
  if (!start || !end) return null;
  for (const s of plans) {
    if (s.id === excludeId) continue;
    if (!s.startDate || !s.endDate) continue;
    if (start <= s.endDate && end >= s.startDate) return s;
  }
  return null;
}

export default function PlanEditor({ plan, plans = [], onSave, onClose }) {
  const isEdit = !!plan;
  const [label, setLabel] = useState(plan?.label || "");
  const [color, setColor] = useState(plan?.color || PLAN_COLORS[0]);
  const [startDate, setStartDate] = useState(plan?.startDate || "");
  const [endDate, setEndDate] = useState(plan?.endDate || "");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (endDate < startDate) {
      setError("End date must be after start date.");
      return;
    }

    const overlap = hasOverlap(startDate, endDate, plans, plan?.id);
    if (overlap) {
      setError(`Overlaps with "${overlap.label}" (${overlap.startDate} \u2013 ${overlap.endDate}).`);
      return;
    }

    onSave({ label: label.trim(), color, startDate, endDate });
  };

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{isEdit ? "Edit Plan" : "New Plan"}</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <label className="modal-label">
            Label
            <input
              className="modal-input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Ramadan"
              required
              autoFocus
            />
          </label>
          <div className="modal-row">
            <label className="modal-label" style={{ flex: 1 }}>
              Start Date
              <input
                className="modal-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </label>
            <label className="modal-label" style={{ flex: 1 }}>
              End Date
              <input
                className="modal-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </label>
          </div>
          {error && <div className="plan-error">{error}</div>}
          <div className="modal-label">
            Color
            <div className="color-grid">
              {PLAN_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-btn ${color === c ? "active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
