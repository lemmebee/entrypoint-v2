import { useEffect } from "react";

export default function ConfirmModal({ title, message, confirmLabel = "Delete", onConfirm, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
        <h3 className="modal-title">{title}</h3>
        <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 20px", lineHeight: 1.5 }}>{message}</p>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
