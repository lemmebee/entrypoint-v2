import { useState, useCallback } from "react";
import { DEFAULT_TYPES } from "../utils/constants";

function parseImportData(raw) {
  const data = JSON.parse(raw);
  if (Array.isArray(data)) {
    return { plans: data.map(p => ({ ...p, id: p.id || crypto.randomUUID() })), customTypes: [], pipelines: [] };
  }
  if (data && Array.isArray(data.plans)) {
    return {
      plans: data.plans.map(p => ({ ...p, id: p.id || crypto.randomUUID() })),
      customTypes: Array.isArray(data.customTypes) ? data.customTypes : [],
      pipelines: Array.isArray(data.pipelines) ? data.pipelines : [],
    };
  }
  throw new Error("Unrecognized format");
}

function buildSummary(imported, existingPlans, existingCustomTypes, existingPipelines = []) {
  const existingPlanIds = new Set(existingPlans.map(p => p.id));
  const existingTypeKeys = new Set([...DEFAULT_TYPES, ...existingCustomTypes.map(t => t.key)]);
  const existingPipelineIds = new Set(existingPipelines.map(s => s.id));
  return {
    newPlans: imported.plans.filter(p => !existingPlanIds.has(p.id)),
    skippedPlans: imported.plans.filter(p => existingPlanIds.has(p.id)),
    newTypes: imported.customTypes.filter(t => !existingTypeKeys.has(t.key)),
    skippedTypes: imported.customTypes.filter(t => existingTypeKeys.has(t.key)),
    newPipelines: (imported.pipelines || []).filter(s => !existingPipelineIds.has(s.id)),
    skippedPipelines: (imported.pipelines || []).filter(s => existingPipelineIds.has(s.id)),
  };
}

export default function ImportModal({ file, existingPlans, existingCustomTypes, existingPipelines = [], onConfirm, onClose }) {
  const [error, setError] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [summary, setSummary] = useState(null);
  const [selectedPlans, setSelectedPlans] = useState(new Set());
  const [selectedTypes, setSelectedTypes] = useState(new Set());
  const [selectedPipelines, setSelectedPipelines] = useState(new Set());

  useState(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = parseImportData(e.target.result);
        if (imported.plans.length === 0 && imported.customTypes.length === 0) {
          setError("File contains no data to import.");
          return;
        }
        const s = buildSummary(imported, existingPlans, existingCustomTypes, existingPipelines);
        setParsed(imported);
        setSummary(s);
        setSelectedPlans(new Set(s.newPlans.map(p => p.id)));
        setSelectedTypes(new Set(s.newTypes.map(t => t.key)));
        setSelectedPipelines(new Set(s.newPipelines.map(p => p.id)));
      } catch (err) {
        setError("Invalid file: " + err.message);
      }
    };
    reader.readAsText(file);
  });

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

  const handleConfirm = useCallback(() => {
    if (!summary) return;
    const plans = summary.newPlans.filter(p => selectedPlans.has(p.id));
    const types = summary.newTypes.filter(t => selectedTypes.has(t.key));
    const pipelines = summary.newPipelines.filter(s => selectedPipelines.has(s.id));
    onConfirm(plans, types, pipelines);
  }, [summary, selectedPlans, selectedTypes, selectedPipelines, onConfirm]);

  const totalSelected = selectedPlans.size + selectedTypes.size + selectedPipelines.size;
  const nothingAvailable = summary && summary.newPlans.length === 0 && summary.newTypes.length === 0 && summary.newPipelines.length === 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <h3 className="modal-title">Import Data</h3>

        {error && (
          <>
            <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 16px" }}>{error}</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose}>Close</button>
            </div>
          </>
        )}

        {!error && !summary && (
          <p style={{ color: "#94a3b8", fontSize: 13 }}>Reading file...</p>
        )}

        {summary && (
          <>
            <div className="import-section">
              <div className="import-section-title">Plans</div>
              {summary.newPlans.length > 0 && (
                <div className="import-items">
                  {summary.newPlans.map(p => (
                    <label key={p.id} className="import-item" style={{ cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        className="import-check"
                        checked={selectedPlans.has(p.id)}
                        onChange={() => togglePlan(p.id)}
                      />
                      <span className="import-badge import-badge--new">new</span>
                      <span className="import-item-label">{p.label}</span>
                      {p.startDate && <span className="import-item-date">{p.startDate} – {p.endDate}</span>}
                    </label>
                  ))}
                </div>
              )}
              {summary.skippedPlans.length > 0 && (
                <div className="import-items">
                  {summary.skippedPlans.map(p => (
                    <div key={p.id} className="import-item import-item--disabled">
                      <span className="import-badge import-badge--skip">exists</span>
                      <span className="import-item-label">{p.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {parsed.plans.length === 0 && <p className="import-empty">No plans in file</p>}
            </div>

            <div className="import-section">
              <div className="import-section-title">Custom Types</div>
              {summary.newTypes.length > 0 && (
                <div className="import-items">
                  {summary.newTypes.map(t => (
                    <label key={t.key} className="import-item" style={{ cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        className="import-check"
                        checked={selectedTypes.has(t.key)}
                        onChange={() => toggleType(t.key)}
                      />
                      <span className="import-badge import-badge--new">new</span>
                      <span className="import-item-label">{t.name}</span>
                    </label>
                  ))}
                </div>
              )}
              {summary.skippedTypes.length > 0 && (
                <div className="import-items">
                  {summary.skippedTypes.map(t => (
                    <div key={t.key} className="import-item import-item--disabled">
                      <span className="import-badge import-badge--skip">exists</span>
                      <span className="import-item-label">{t.name || t.key}</span>
                    </div>
                  ))}
                </div>
              )}
              {parsed.customTypes.length === 0 && <p className="import-empty">No custom types in file</p>}
            </div>

            <div className="import-section">
              <div className="import-section-title">Pipeline Sections</div>
              {summary.newPipelines.length > 0 && (
                <div className="import-items">
                  {summary.newPipelines.map(s => (
                    <label key={s.id} className="import-item" style={{ cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        className="import-check"
                        checked={selectedPipelines.has(s.id)}
                        onChange={() => togglePipeline(s.id)}
                      />
                      <span className="import-badge import-badge--new">new</span>
                      <span className="import-item-label">{s.title}</span>
                      <span className="import-item-date">{(s.items || []).length} items</span>
                    </label>
                  ))}
                </div>
              )}
              {summary.skippedPipelines.length > 0 && (
                <div className="import-items">
                  {summary.skippedPipelines.map(s => (
                    <div key={s.id} className="import-item import-item--disabled">
                      <span className="import-badge import-badge--skip">exists</span>
                      <span className="import-item-label">{s.title}</span>
                    </div>
                  ))}
                </div>
              )}
              {(parsed.pipelines || []).length === 0 && <p className="import-empty">No pipeline sections in file</p>}
            </div>

            {nothingAvailable && (
              <p style={{ color: "#f59e0b", fontSize: 13, marginTop: 8 }}>
                Everything already exists. Nothing to import.
              </p>
            )}

            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              {!nothingAvailable && (
                <button className="btn-primary" onClick={handleConfirm} disabled={totalSelected === 0}>
                  Import{totalSelected > 0 ? ` ${totalSelected} item${totalSelected !== 1 ? "s" : ""}` : ""}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
