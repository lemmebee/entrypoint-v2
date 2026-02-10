import { useState, useEffect } from "react";
import { blockTypes, typeColors } from "../utils/constants";

const ICONS = [
  "\ud83d\udd4c", "\ud83c\udf19", "\ud83c\udfa7", "\ud83e\udde0",
  "\ud83d\udcda", "\ud83c\uddeb\ud83c\uddf7", "\ud83d\udcbc", "\u26a1",
  "\ud83d\udcaa", "\u2615", "\ud83c\udf3f", "\ud83d\ude34",
  "\ud83d\udeb6", "\ud83c\udf7d\ufe0f", "\u23f0", "\ud83d\udccb",
  "\ud83d\udcdd", "\ud83c\udfb5", "\ud83c\udfa8", "\ud83d\udcbb",
  "\ud83c\udfaf", "\ud83e\uddd8", "\ud83c\udfc3", "\ud83d\ude80",
  "\ud83d\udca1", "\ud83d\udd25", "\u2764\ufe0f", "\u2b50",
  "\ud83c\udf1f", "\ud83d\udcf1", "\ud83c\udfac", "\ud83d\udcf0",
];

function minToTime(m) {
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}


export default function BlockEditor({ block, defaultTime, segments, onSave, onDelete, onClose, customTypes = [], customTypeColors = {}, onAddCustomType, onRemoveCustomType }) {
  useEffect(() => {
    if (!block) return;
    const handler = (e) => {
      if (e.key === "Delete") {
        e.preventDefault();
        onDelete(block.id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [block, onDelete]);

  const isEdit = !!block;
  const initStart = block?.time || defaultTime || "08:00";
  const initDur = block?.duration || 60;
  const [time, setTime] = useState(initStart);
  const [endTime, setEndTime] = useState(() => {
    const [h, m] = initStart.split(":").map(Number);
    const end = h * 60 + m + initDur;
    return minToTime(end);
  });
  const [activity, setActivity] = useState(block?.activity || "");
  const [type, setType] = useState(block?.type || "neutral");
  const [icon, setIcon] = useState(block?.icon || "\ud83d\udccc");
  const [tasks, setTasks] = useState(block?.tasks || []);
  const [newTask, setNewTask] = useState("");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showNewType, setShowNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  const customKeys = new Set(customTypes.map((t) => t.key));
  const allTypes = [...blockTypes, ...customTypes.map((t) => t.key)];
  const allTypeColors = { ...typeColors, ...customTypeColors };
  const currentColor = allTypeColors[type] || typeColors.neutral;

  const computeDuration = () => {
    const [sh, sm] = time.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    return Math.max(15, (eh * 60 + em) - (sh * 60 + sm));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: block?.id || crypto.randomUUID(),
      time,
      activity: activity.trim(),
      type,
      icon,
      duration: computeDuration(),
      segment: null,
      offsetMinutes: 0,
      tasks,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <div className="modal" onClick={(e) => { e.stopPropagation(); if (showTypeDropdown) setShowTypeDropdown(false); }}>
        <h3 className="modal-title">{isEdit ? "Edit Block" : "Add Block"}</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-row">
            <label className="modal-label" style={{ flex: 1 }}>
              Start
              <input className="modal-input" value={time} onChange={(e) => {
                const newStart = e.target.value;
                setTime(newStart);
                const [oh, om] = time.split(":").map(Number);
                const [eh, em] = endTime.split(":").map(Number);
                const dur = (eh * 60 + em) - (oh * 60 + om);
                if (dur > 0 && /^\d{2}:\d{2}$/.test(newStart)) {
                  const [nh, nm] = newStart.split(":").map(Number);
                  setEndTime(minToTime(nh * 60 + nm + dur));
                }
              }} placeholder="HH:MM" pattern="\d{2}:\d{2}" />
            </label>
            <label className="modal-label" style={{ flex: 1 }}>
              End
              <input className="modal-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="HH:MM" pattern="\d{2}:\d{2}" />
            </label>
          </div>

          <label className="modal-label">
            Activity
            <input
              className="modal-input"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="e.g. Quran revision"
              required
              autoFocus
            />
          </label>
          <div className="modal-label">
            Type
            <div className="modal-row" style={{ gap: 6, alignItems: "center" }}>
              <div className="type-picker" style={{ flex: 1 }} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="type-picker-btn"
                  onClick={() => setShowTypeDropdown((v) => !v)}
                >
                  <span className="type-color-dot" style={{ background: currentColor.border }} />
                  <span>{type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " ")}</span>
                  <span className="type-picker-arrow">{showTypeDropdown ? "\u25b4" : "\u25be"}</span>
                </button>
                {showTypeDropdown && (
                  <div className="type-dropdown">
                    {allTypes.map((t) => {
                      const c = allTypeColors[t] || typeColors.neutral;
                      const isCustom = customKeys.has(t);
                      return (
                        <div key={t} className={`type-dropdown-item${t === type ? " active" : ""}`}>
                          <button
                            type="button"
                            className="type-dropdown-select"
                            onClick={() => { setType(t); setShowTypeDropdown(false); }}
                          >
                            <span className="type-color-dot" style={{ background: c.border }} />
                            <span>{t.charAt(0).toUpperCase() + t.slice(1).replace(/-/g, " ")}</span>
                          </button>
                          {isCustom && onRemoveCustomType && (
                            <button
                              type="button"
                              className="type-delete-btn"
                              onClick={() => {
                                onRemoveCustomType(t);
                                if (type === t) setType("neutral");
                              }}
                            >&times;</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn-add-type"
                onClick={() => setShowNewType((v) => !v)}
                title="Add custom type"
              >+</button>
            </div>
          </div>
          {showNewType && (
            <div className="new-type-form">
              <input
                className="modal-input"
                placeholder="Type name"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTypeName.trim() && onAddCustomType) {
                    e.preventDefault();
                    const key = onAddCustomType(newTypeName.trim());
                    setType(key);
                    setNewTypeName("");
                    setShowNewType(false);
                  }
                }}
              />
              <button
                type="button"
                className="btn-primary btn-sm"
                disabled={!newTypeName.trim()}
                onClick={() => {
                  if (!newTypeName.trim() || !onAddCustomType) return;
                  const key = onAddCustomType(newTypeName.trim());
                  setType(key);
                  setNewTypeName("");
                  setShowNewType(false);
                }}
              >Add</button>
            </div>
          )}
          <div className="modal-label">
            Icon
            <div className="icon-grid">
              {ICONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className={`icon-btn ${icon === em ? "active" : ""}`}
                  onClick={() => setIcon(em)}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
          {/* Tasks sub-list */}
          <div className="modal-label">
            Tasks
            <div className="task-list-editor">
              {tasks.map((t, i) => (
                <div key={t.id} className="task-edit-row">
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => {
                      const next = [...tasks];
                      next[i] = { ...t, done: !t.done };
                      setTasks(next);
                    }}
                  />
                  <input
                    className={`modal-input task-edit-input${t.done ? " task-done" : ""}`}
                    value={t.text}
                    onChange={(e) => {
                      const next = [...tasks];
                      next[i] = { ...t, text: e.target.value };
                      setTasks(next);
                    }}
                  />
                  <button
                    type="button"
                    className="task-remove-btn"
                    onClick={() => setTasks(tasks.filter((_, j) => j !== i))}
                  >
                    &times;
                  </button>
                </div>
              ))}
              <div className="task-edit-row">
                <input
                  className="modal-input task-edit-input"
                  placeholder="Add task..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTask.trim()) {
                      e.preventDefault();
                      setTasks([...tasks, { id: crypto.randomUUID(), text: newTask.trim(), done: false }]);
                      setNewTask("");
                    }
                  }}
                />
                <button
                  type="button"
                  className="task-add-btn"
                  disabled={!newTask.trim()}
                  onClick={() => {
                    if (!newTask.trim()) return;
                    setTasks([...tasks, { id: crypto.randomUUID(), text: newTask.trim(), done: false }]);
                    setNewTask("");
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <div className="modal-actions">
            {isEdit && (
              <button
                type="button"
                className="btn-danger"
                onClick={() => onDelete(block.id)}
              >
                Delete
              </button>
            )}
            <div style={{ flex: 1 }} />
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
