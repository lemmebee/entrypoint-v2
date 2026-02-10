import { useState, useRef, useEffect } from "react";
import { formatDateRange } from "../utils/dateUtils";
import ConfirmModal from "./ConfirmModal";

export default function PlanSidebar({ plans, activePlanId, onSelect, onCreate, onEdit, onDelete }) {
  const [contextMenu, setContextMenu] = useState(null);
  const [deletingPlan, setDeletingPlan] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e) => { if (e.key === "Escape") setContextMenu(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [contextMenu]);

  const handleContext = (e, plan) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, plan });
  };

  const handleWheel = (e) => {
    const el = listRef.current;
    if (el && el.scrollWidth > el.clientWidth) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="plan-sidebar">
      <div className="plan-list" ref={listRef} onWheel={handleWheel}>
        {plans.map((plan) => (
          <button
            key={plan.id}
            className={`plan-item ${plan.id === activePlanId ? "active" : ""}`}
            onClick={() => onSelect(plan.id)}
            onContextMenu={(e) => handleContext(e, plan)}
          >
            <span
              className="plan-dot"
              style={{ background: plan.color }}
            />
            <div className="plan-info">
              <span className="plan-label">{plan.label}</span>
              {plan.startDate && plan.endDate && (
                <span className="plan-dates">
                  {formatDateRange(plan.startDate, plan.endDate)}
                </span>
              )}
            </div>
          </button>
        ))}
        <button className="plan-item plan-add" onClick={onCreate}>
          + New Plan
        </button>
      </div>

      {contextMenu && (
        <>
          <div className="context-overlay" onClick={() => setContextMenu(null)} />
          <div
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={() => {
                onEdit(contextMenu.plan);
                setContextMenu(null);
              }}
            >
              Edit
            </button>
            <button
              className="danger"
              onClick={() => {
                setDeletingPlan(contextMenu.plan);
                setContextMenu(null);
              }}
            >
              Delete
            </button>
          </div>
        </>
      )}
      {deletingPlan && (
        <ConfirmModal
          title="Delete Plan"
          message={`Delete "${deletingPlan.label}"? This cannot be undone.`}
          onConfirm={() => { onDelete(deletingPlan.id); setDeletingPlan(null); }}
          onClose={() => setDeletingPlan(null)}
        />
      )}
    </div>
  );
}
