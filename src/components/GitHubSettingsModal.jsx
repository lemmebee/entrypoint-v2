import { useState, useEffect } from "react";

export default function GitHubSettingsModal({ settings, onSave, onClose }) {
  const [repo, setRepo] = useState(settings?.repo || "");
  const [token, setToken] = useState(settings?.token || "");
  const [path, setPath] = useState(settings?.path || "schedule.json");

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const valid = repo.includes("/") && token.trim().length > 0;

  const handleSave = () => {
    if (!valid) return;
    onSave({ repo: repo.trim(), token: token.trim(), path: path.trim() || "schedule.json" });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
        <h3 className="modal-title">GitHub Sync Settings</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <label className="modal-label">
            REPO (owner/repo)
            <input
              className="modal-input"
              placeholder="owner/repo"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
            />
          </label>
          <label className="modal-label">
            TOKEN
            <input
              className="modal-input"
              type="password"
              placeholder="ghp_..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </label>
          <label className="modal-label">
            FILE PATH
            <input
              className="modal-input"
              placeholder="schedule.json"
              value={path}
              onChange={(e) => setPath(e.target.value)}
            />
          </label>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={!valid}>Save</button>
        </div>
      </div>
    </div>
  );
}
