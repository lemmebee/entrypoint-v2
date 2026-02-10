import { useState } from "react";

export default function TabEditor({ tab, onSave, onClose }) {
  const [label, setLabel] = useState(tab?.label || "");
  const [dates, setDates] = useState(tab?.dates || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ label: label.trim(), dates: dates.trim() });
  };

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{tab ? "Edit Tab" : "New Tab"}</h3>
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
          <label className="modal-label">
            Date Range
            <input
              className="modal-input"
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              placeholder="e.g. Feb 18 → Mar 23"
            />
          </label>
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
