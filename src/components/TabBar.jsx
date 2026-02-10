import { useState, useEffect } from "react";

export default function TabBar({ tabs, activeTabId, onSelect, onCreate, onEdit, onDelete }) {
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e) => { if (e.key === "Escape") setContextMenu(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [contextMenu]);

  const handleContext = (e, tab) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, tab });
  };

  return (
    <div className="tab-bar">
      <div className="tab-list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-item ${tab.id === activeTabId ? "active" : ""}`}
            onClick={() => onSelect(tab.id)}
            onContextMenu={(e) => handleContext(e, tab)}
          >
            <span className="tab-label">{tab.label}</span>
            {tab.dates && <span className="tab-dates">{tab.dates}</span>}
          </button>
        ))}
        <button className="tab-item tab-add" onClick={onCreate}>
          +
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
                onEdit(contextMenu.tab);
                setContextMenu(null);
              }}
            >
              Rename
            </button>
            <button
              className="danger"
              onClick={() => {
                if (confirm(`Delete "${contextMenu.tab.label}"?`)) {
                  onDelete(contextMenu.tab.id);
                }
                setContextMenu(null);
              }}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
