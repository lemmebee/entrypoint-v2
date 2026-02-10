import { useState, useRef, useEffect } from "react";
import ConfirmModal from "./ConfirmModal";

const EMOJI_QUICK = ["🔹", "🚀", "📚", "💡", "🎯", "🔧", "🎨", "📝", "⚡", "🌱", "🏗️", "🧪", "📊", "🔥", "💼", "🎮"];

function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="pipeline-emoji-picker" ref={ref}>
      <button className="pipeline-emoji-btn" onClick={() => setOpen(!open)}>{value || "🔹"}</button>
      {open && (
        <div className="pipeline-emoji-grid">
          {EMOJI_QUICK.map((e) => (
            <button key={e} className="pipeline-emoji-option" onClick={() => { onChange(e); setOpen(false); }}>{e}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function InlineEdit({ value, onChange, className, placeholder, singleClick }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onChange(draft.trim());
  };

  const startEdit = (e) => { e.stopPropagation(); setDraft(value); setEditing(true); };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={`pipeline-inline-input ${className || ""}`}
        value={draft}
        placeholder={placeholder}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
      />
    );
  }

  const handlers = singleClick ? { onClick: startEdit } : { onDoubleClick: startEdit };

  return (
    <span
      className={`pipeline-inline-text ${className || ""} ${!value ? "pipeline-placeholder" : ""}`}
      {...handlers}
    >
      {value || placeholder}
    </span>
  );
}

function PipelineItem({ item, sectionId, onUpdate, onDelete }) {
  return (
    <div className="pipeline-item">
      <EmojiPicker value={item.icon} onChange={(icon) => onUpdate(sectionId, item.id, { icon })} />
      <div className="pipeline-item-content">
        <InlineEdit
          value={item.title}
          onChange={(title) => onUpdate(sectionId, item.id, { title })}
          className="pipeline-item-title"
          placeholder="Item title"
        />
        <InlineEdit
          value={item.description}
          onChange={(description) => onUpdate(sectionId, item.id, { description })}
          className="pipeline-item-desc"
          placeholder="Description"
        />
      </div>
      <button className="pipeline-item-delete" onClick={() => onDelete(sectionId, item.id)}>&times;</button>
    </div>
  );
}

export default function PipelineSections({
  sections, addSection, updateSection, deleteSection,
  toggleCollapse, addItem, updateItem, deleteItem,
}) {
  const [confirmDelete, setConfirmDelete] = useState(null);

  return (
    <div className="pipeline-sections">
      {sections.map((section) => (
        <div key={section.id} className="pipeline-section">
          <div className="pipeline-section-header" onClick={() => toggleCollapse(section.id)}>
            <span className="pipeline-collapse-btn">
              {section.collapsed ? "▸" : "▾"}
            </span>
            <InlineEdit
              value={section.title}
              onChange={(title) => updateSection(section.id, { title })}
              className="pipeline-section-title"
              placeholder="Section title"
              singleClick
            />
            <button className="pipeline-section-delete" onClick={(e) => { e.stopPropagation(); setConfirmDelete(section.id); }}>&times;</button>
          </div>

          {!section.collapsed && (
            <div className="pipeline-section-body">
              {(section.items || []).map((item) => (
                <PipelineItem
                  key={item.id}
                  item={item}
                  sectionId={section.id}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                />
              ))}
              <button className="pipeline-add-item" onClick={() => addItem(section.id, {})}>+ Add</button>
            </div>
          )}
        </div>
      ))}

      <button className="pipeline-add-section" onClick={() => addSection("New Section")}>+ New Section</button>

      {confirmDelete && (
        <ConfirmModal
          title="Delete Section"
          message="This will delete the section and all its items."
          onConfirm={() => { deleteSection(confirmDelete); setConfirmDelete(null); }}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
