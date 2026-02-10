import { useState, useEffect } from "react";

export default function LocationModal({ onSave, onClose }) {
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && onClose) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = () => {
    const trimCity = city.trim();
    const trimCountry = country.trim();
    if (!trimCity || !trimCountry) return;
    onSave({ city: trimCity, country: trimCountry });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
  };

  return (
    <div className="modal-overlay" onClick={onClose || undefined}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
        <h3 className="modal-title">Set Your Location</h3>
        <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 16px", lineHeight: 1.5 }}>
          Used to calculate prayer times.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <input
            className="modal-input"
            placeholder="City (e.g. Lyon)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <input
            className="modal-input"
            placeholder="Country (e.g. France)"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="modal-actions">
          {onClose && <button className="btn-secondary" onClick={onClose}>Cancel</button>}
          <button className="btn-primary" onClick={handleSave} disabled={!city.trim() || !country.trim()}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
