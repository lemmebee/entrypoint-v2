import { useState, useCallback } from "react";

export default function ExportModal({ plans, customTypes, pipelineSections = [], onClose }) {
  const [selectedPlans, setSelectedPlans] = useState(() => new Set(plans.map(p => p.id)));
  const [selectedTypes, setSelectedTypes] = useState(() => new Set(customTypes.map(t => t.key)));
  const [selectedPipelines, setSelectedPipelines] = useState(() => new Set(pipelineSections.map(s => s.id)));

  const togglePlan = useCallback((id) => {
    setSelectedPlans(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleType = useCallback((key) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const togglePipeline = useCallback((id) => {
    setSelectedPipelines(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const totalSelected = selectedPlans.size + selectedTypes.size + selectedPipelines.size;

  const handleExport = useCallback(() => {
    const exportPlans = plans.filter(p => selectedPlans.has(p.id));
    const exportTypes = customTypes.filter(t => selectedTypes.has(t.key)).map(t => ({ key: t.key, name: t.name }));
    const exportPipelines = pipelineSections.filter(s => selectedPipelines.has(s.id));
    const payload = { version: 2, plans: exportPlans, customTypes: exportTypes, pipelines: exportPipelines };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "entrypoint-v2-plans.json";
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  }, [plans, customTypes, pipelineSections, selectedPlans, selectedTypes, selectedPipelines, onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <h3 className="modal-title">Export Data</h3>

        <div className="import-section">
          <div className="import-section-title">Plans</div>
          {plans.length > 0 ? (
            <div className="import-items">
              {plans.map(p => (
                <label key={p.id} className="import-item" style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    className="import-check"
                    checked={selectedPlans.has(p.id)}
                    onChange={() => togglePlan(p.id)}
                  />
                  <span className="import-item-label">{p.label}</span>
                  {p.startDate && <span className="import-item-date">{p.startDate} – {p.endDate}</span>}
                </label>
              ))}
            </div>
          ) : (
            <p className="import-empty">No plans to export</p>
          )}
        </div>

        <div className="import-section">
          <div className="import-section-title">Custom Types</div>
          {customTypes.length > 0 ? (
            <div className="import-items">
              {customTypes.map(t => (
                <label key={t.key} className="import-item" style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    className="import-check"
                    checked={selectedTypes.has(t.key)}
                    onChange={() => toggleType(t.key)}
                  />
                  <span className="import-item-label">{t.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="import-empty">No custom types to export</p>
          )}
        </div>

        <div className="import-section">
          <div className="import-section-title">Pipeline Sections</div>
          {pipelineSections.length > 0 ? (
            <div className="import-items">
              {pipelineSections.map(s => (
                <label key={s.id} className="import-item" style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    className="import-check"
                    checked={selectedPipelines.has(s.id)}
                    onChange={() => togglePipeline(s.id)}
                  />
                  <span className="import-item-label">{s.title}</span>
                  <span className="import-item-date">{(s.items || []).length} items</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="import-empty">No pipeline sections to export</p>
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleExport} disabled={totalSelected === 0}>
            Export{totalSelected > 0 ? ` ${totalSelected} item${totalSelected !== 1 ? "s" : ""}` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
