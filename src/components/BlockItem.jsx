import { useState, useRef, useCallback, useEffect } from "react";
import { typeColors } from "../utils/constants";

const HOUR_HEIGHT = 60;
const SNAP = 5;
const MIN_DUR = 15;
const BLOCK_LEFT = 52;
const BLOCK_RIGHT = 8;

function snapMin(m) {
  return Math.max(0, Math.min(23 * 60 + 55, Math.round(m / SNAP) * SNAP));
}

function minToTime(m) {
  m = Math.round(m);
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export default function BlockItem({ block, top, height, col = 0, totalCols = 1, isNew, isPrayer, extraTypeColors = {}, onEdit, onDelete, onTimeChange, onResize, onToggleTask }) {
  const elRef = useRef(null);
  const timeRef = useRef(null);
  const drag = useRef(null);
  const raf = useRef(null);
  const holdTimer = useRef(null);
  const [ctxMenu, setCtxMenu] = useState(null);

  const colors = typeColors[block.type] || extraTypeColors[block.type] || typeColors.neutral;
  const textColor = isPrayer ? "#2d8a4e" : (colors.text === "#94a3b8" ? "#b0b0ba" : colors.text);
  const fw = (block.type === "prayer" || isPrayer) ? 600 : 400;

  const startMin = (top / HOUR_HEIGHT) * 60;
  const dur = (height / HOUR_HEIGHT) * 60;
  const endTime = minToTime(Math.min(startMin + dur, 24 * 60));
  const startDisplay = block.time;

  const totalWidth = `calc(100% - ${BLOCK_LEFT}px - ${BLOCK_RIGHT}px)`;
  const colWidth = `calc((${totalWidth}) / ${totalCols})`;
  const leftPos = `calc(${BLOCK_LEFT}px + (${totalWidth}) * ${col} / ${totalCols})`;

  const applyVisuals = useCallback((delta, mode) => {
    const el = elRef.current;
    const timeEl = timeRef.current;
    if (!el) return;

    if (mode === "move") {
      const vTop = top + delta;
      el.style.top = `${vTop}px`;
      el.style.left = `${BLOCK_LEFT}px`;
      el.style.width = `calc(100% - ${BLOCK_LEFT}px - ${BLOCK_RIGHT}px)`;
      el.style.zIndex = "10000";
      el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.5)";
      el.style.opacity = "0.85";
      el.style.cursor = "grabbing";
      const moved = snapMin(((top + delta) / HOUR_HEIGHT) * 60);
      if (timeEl) timeEl.textContent = `${minToTime(moved)} \u2013 ${minToTime(Math.min(moved + dur, 1440))}`;
    } else if (mode === "top") {
      const vTop = top + delta;
      const vH = Math.max(height - delta, (MIN_DUR / 60) * HOUR_HEIGHT);
      el.style.top = `${vTop}px`;
      el.style.height = `${Math.max(vH, 24)}px`;
      el.style.zIndex = "10000";
      el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.5)";
      el.style.opacity = "0.85";
      const liveStart = snapMin(startMin + (delta / HOUR_HEIGHT) * 60);
      if (timeEl) timeEl.textContent = `${minToTime(liveStart)} \u2013 ${minToTime(Math.min(startMin + dur, 1440))}`;
    } else if (mode === "bottom") {
      const vH = Math.max(height + delta, (MIN_DUR / 60) * HOUR_HEIGHT);
      el.style.height = `${Math.max(vH, 24)}px`;
      el.style.zIndex = "10000";
      el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.5)";
      el.style.opacity = "0.85";
      const liveEnd = startMin + Math.max(MIN_DUR, snapMin(dur + (delta / HOUR_HEIGHT) * 60));
      if (timeEl) timeEl.textContent = `${minToTime(startMin)} \u2013 ${minToTime(Math.min(liveEnd, 1440))}`;
    }
  }, [top, height, startMin, dur]);

  const resetVisuals = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    el.style.top = `${top}px`;
    el.style.height = `${Math.max(height, 24)}px`;
    el.style.left = leftPos;
    el.style.width = colWidth;
    el.style.zIndex = isPrayer ? "10" : String(Math.ceil(top) + 1);
    el.style.boxShadow = "none";
    el.style.opacity = "1";
    el.style.cursor = isPrayer ? "default" : "pointer";
    const compact = height < 36;
    if (timeRef.current) timeRef.current.textContent = compact ? startDisplay : `${startDisplay} \u2013 ${endTime}`;
  }, [top, height, leftPos, colWidth, startDisplay, endTime, isPrayer]);

  // Re-sync time text after React re-render (textContent from drag breaks React's DOM ownership)
  useEffect(() => {
    const compact = height < 36;
    if (timeRef.current) timeRef.current.textContent = compact ? startDisplay : `${startDisplay} \u2013 ${endTime}`;
  }, [startDisplay, endTime, height]);

  // --- pointer handlers (disabled for prayer blocks) ---
  // Touch requires long-press (300ms) before drag activates to avoid hijacking scroll.
  const HOLD_MS = 300;

  const onPointerDown = (e) => {
    if (isPrayer || e.button !== 0) return;
    const isTouch = e.pointerType === "touch";
    if (isTouch) {
      // Start hold timer — don't capture yet
      const pid = e.pointerId;
      holdTimer.current = setTimeout(() => {
        holdTimer.current = null;
        drag.current = { y: e.clientY, mode: "move", moved: false, touch: true };
        elRef.current?.setPointerCapture(pid);
        navigator.vibrate?.(20);
      }, HOLD_MS);
    } else {
      drag.current = { y: e.clientY, mode: "move", moved: false, touch: false };
      elRef.current.setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = (e) => {
    // If hold timer is pending and finger moved, cancel — it's a scroll
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
      return;
    }
    if (!drag.current) return;
    const delta = e.clientY - drag.current.y;
    if (!drag.current.moved && Math.abs(delta) > 4) drag.current.moved = true;
    if (!drag.current.moved) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => applyVisuals(delta, drag.current.mode));
  };

  const onPointerUp = (e) => {
    // Cancel hold timer if still pending
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
      // Touch tap without hold — open editor
      if (e.pointerType === "touch" && !isPrayer) onEdit(block);
      return;
    }
    if (!drag.current) return;
    const delta = e.clientY - drag.current.y;
    const { mode, moved } = drag.current;
    drag.current = null;
    if (raf.current) cancelAnimationFrame(raf.current);

    resetVisuals();

    if (!moved) {
      if (!isPrayer) onEdit(block);
      return;
    }

    if (mode === "move") {
      const newMin = snapMin(((top + delta) / HOUR_HEIGHT) * 60);
      onTimeChange(block.id, minToTime(newMin));
    } else if (mode === "top") {
      const newStart = snapMin(startMin + (delta / HOUR_HEIGHT) * 60);
      const newDur = Math.max(MIN_DUR, Math.round((startMin + dur - newStart) / SNAP) * SNAP);
      onResize(block.id, minToTime(newStart), newDur);
    } else if (mode === "bottom") {
      const newDur = Math.max(MIN_DUR, snapMin(dur + (delta / HOUR_HEIGHT) * 60));
      onResize(block.id, minToTime(startMin), newDur);
    }
  };

  const onPointerCancel = () => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    if (drag.current) { drag.current = null; resetVisuals(); }
  };

  const onResizeDown = (edge) => (e) => {
    if (isPrayer) return;
    e.stopPropagation();
    if (e.button !== 0) return;
    const isTouch = e.pointerType === "touch";
    if (isTouch) {
      const pid = e.pointerId;
      holdTimer.current = setTimeout(() => {
        holdTimer.current = null;
        drag.current = { y: e.clientY, mode: edge, moved: true, touch: true };
        e.target?.setPointerCapture(pid);
        navigator.vibrate?.(20);
      }, HOLD_MS);
    } else {
      drag.current = { y: e.clientY, mode: edge, moved: true, touch: false };
      e.target.setPointerCapture(e.pointerId);
    }
  };

  // --- context menu ---
  const handleContextMenu = (e) => {
    if (isPrayer) return;
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  };

  const closeCtx = () => setCtxMenu(null);

  useEffect(() => {
    if (!ctxMenu) return;
    const handler = (e) => { if (e.key === "Escape") closeCtx(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [ctxMenu]);

  const hasTasks = !isPrayer && block.tasks?.length > 0;
  const tasksDone = hasTasks ? block.tasks.filter((t) => t.done).length : 0;
  const isCompact = height < 36;
  const showTasks = hasTasks && height >= 60;

  return (
    <>
      <div
        ref={elRef}
        className={`timeline-block ${isNew ? "new-block" : ""} ${isPrayer ? "prayer-block" : ""}`}
        style={{
          top,
          height: Math.max(height, 24),
          left: leftPos,
          width: colWidth,
          right: "auto",
          background: isPrayer ? "rgba(34, 139, 34, 0.10)" : colors.bg,
          borderLeft: `3px solid ${isPrayer ? "#2d8a4e" : colors.border}`,
          zIndex: isPrayer ? 10 : Math.ceil(top) + 1,
          cursor: isPrayer ? "default" : "pointer",
          transition: "box-shadow 0.15s",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onContextMenu={handleContextMenu}
      >
        {!isPrayer && (
          <>
            <div
              className="resize-handle resize-handle-top"
              onPointerDown={onResizeDown("top")}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
            <div
              className="resize-handle resize-handle-bottom"
              onPointerDown={onResizeDown("bottom")}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          </>
        )}

        {isCompact ? (
          <div className="block-compact">
            <span ref={timeRef} className="block-time-sm">{startDisplay}</span>
            <span className="block-icon-sm">{block.icon}</span>
            <span className="block-act-sm" style={{ color: textColor, fontWeight: fw }}>{block.activity}</span>
            {hasTasks && <span className="block-task-badge">{tasksDone}/{block.tasks.length}</span>}
          </div>
        ) : (
          <>
            <div ref={timeRef} className="block-time-sm">{startDisplay} &ndash; {endTime}</div>
            <div className="block-row">
              <span className="block-icon-sm">{block.icon}</span>
              <span className="block-act" style={{ color: textColor, fontWeight: fw }}>{block.activity}</span>
              {hasTasks && !showTasks && <span className="block-task-badge">{tasksDone}/{block.tasks.length}</span>}
            </div>
            {showTasks && (
              <div className="block-tasks" onWheel={(e) => {
                const el = e.currentTarget;
                if (el.scrollHeight > el.clientHeight) {
                  e.stopPropagation();
                }
              }}>
                {block.tasks.map((t) => (
                  <label
                    key={t.id}
                    className={`block-task-item ${t.done ? "done" : ""}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => onToggleTask?.(block.id, t.id)}
                    />
                    <span>{t.text}</span>
                  </label>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {ctxMenu && (
        <>
          <div className="context-overlay" onClick={(e) => { e.stopPropagation(); closeCtx(); }} />
          <div className="context-menu" style={{ top: ctxMenu.y, left: ctxMenu.x }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { closeCtx(); onEdit(block); }}>Edit</button>
            <button className="danger" onClick={() => { closeCtx(); onDelete(block.id); }}>Delete</button>
          </div>
        </>
      )}
    </>
  );
}
