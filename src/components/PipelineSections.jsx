import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  DndContext, DragOverlay, closestCenter,
  PointerSensor, TouchSensor, useSensor, useSensors, useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

function DragHandle({ listeners, attributes }) {
  return (
    <button className="pipeline-item-drag-handle" {...listeners} {...attributes} />
  );
}

function SortablePipelineItem({ item, sectionId, onUpdate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={`pipeline-item${isDragging ? " dragging" : ""}`}>
      <DragHandle listeners={listeners} attributes={attributes} />
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

function ItemOverlay({ item }) {
  return (
    <div className="pipeline-item pipeline-item-overlay">
      <span className="pipeline-item-drag-handle" />
      <div className="pipeline-emoji-picker">
        <button className="pipeline-emoji-btn">{item.icon || "🔹"}</button>
      </div>
      <div className="pipeline-item-content">
        <span className="pipeline-inline-text pipeline-item-title">{item.title || "Item title"}</span>
        <span className="pipeline-inline-text pipeline-item-desc">{item.description || "Description"}</span>
      </div>
    </div>
  );
}

function DroppableSection({ sectionId, children }) {
  const { setNodeRef } = useDroppable({ id: `section-${sectionId}` });
  return <div ref={setNodeRef}>{children}</div>;
}

export default function PipelineSections({
  sections, addSection, updateSection, deleteSection,
  toggleCollapse, addItem, updateItem, deleteItem,
  moveItem, reorderItems,
}) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  // Flat map of itemId -> { item, sectionId }
  const itemMap = useMemo(() => {
    const map = {};
    for (const s of sections) {
      for (const it of s.items || []) {
        map[it.id] = { item: it, sectionId: s.id };
      }
    }
    return map;
  }, [sections]);

  const findContainer = useCallback((id) => {
    // Check if id is a section droppable
    if (typeof id === "string" && id.startsWith("section-")) return id.replace("section-", "");
    return itemMap[id]?.sectionId || null;
  }, [itemMap]);

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragOver = useCallback((event) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    // Move item to new container in real-time for visual feedback
    const activeSection = sections.find((s) => s.id === activeContainer);
    const overSection = sections.find((s) => s.id === overContainer);
    if (!activeSection || !overSection) return;

    const activeItems = activeSection.items || [];
    const overItems = overSection.items || [];
    const activeIndex = activeItems.findIndex((it) => it.id === active.id);
    const overIndex = overItems.findIndex((it) => it.id === over.id);

    const newIndex = overIndex >= 0 ? overIndex : overItems.length;
    moveItem(activeContainer, overContainer, active.id, newIndex);
  }, [findContainer, sections, moveItem]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);
    if (!activeContainer || !overContainer) return;

    // Same container reorder
    if (activeContainer === overContainer) {
      const section = sections.find((s) => s.id === activeContainer);
      if (!section) return;
      const items = section.items || [];
      const oldIndex = items.findIndex((it) => it.id === active.id);
      const newIndex = items.findIndex((it) => it.id === over.id);
      if (oldIndex !== newIndex && oldIndex >= 0 && newIndex >= 0) {
        reorderItems(activeContainer, arrayMove(items, oldIndex, newIndex));
      }
    }
    // Cross-container already handled in onDragOver
  }, [findContainer, sections, reorderItems]);

  const activeItem = activeId ? itemMap[activeId]?.item : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="pipeline-sections">
        {sections.map((section) => {
          const items = section.items || [];
          const itemIds = items.map((it) => it.id);

          return (
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
                <DroppableSection sectionId={section.id}>
                  <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                    <div className="pipeline-section-body">
                      {items.map((item) => (
                        <SortablePipelineItem
                          key={item.id}
                          item={item}
                          sectionId={section.id}
                          onUpdate={updateItem}
                          onDelete={deleteItem}
                        />
                      ))}
                      <button className="pipeline-add-item" onClick={() => addItem(section.id, {})}>+ Add</button>
                    </div>
                  </SortableContext>
                </DroppableSection>
              )}
            </div>
          );
        })}

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

      <DragOverlay>
        {activeItem ? <ItemOverlay item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
