import { useState, useRef, useMemo } from "react";
import PrayerBanner from "./PrayerBanner";
import DaySelector from "./DaySelector";
import BlockItem from "./BlockItem";
import BlockEditor from "./BlockEditor";
import { legendItems, typeColors } from "../utils/constants";

const HOUR_HEIGHT = 60;
const SNAP = 5;
const MIN_BLOCK_H = 24;
const DEFAULT_DUR = 60;
const BLOCK_LEFT = 52;
const BLOCK_RIGHT = 8;

function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minToTime(m) {
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function snapMin(m) {
  return Math.max(0, Math.min(23 * 60 + 55, Math.round(m / SNAP) * SNAP));
}

// compute overlap columns — returns blocks with col/totalCols
function layoutBlocks(blocks) {
  if (!blocks.length) return [];

  // build intervals: [startMin, endMin]
  const items = blocks.map((b) => {
    const s = timeToMin(b.time);
    const dur = b.duration || DEFAULT_DUR;
    return { ...b, startMin: s, endMin: s + dur };
  });

  // sort by start, then by duration desc (wider blocks first)
  items.sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin));

  // greedy column assignment
  const columns = []; // each column = end time of last block in that column
  const result = [];

  for (const item of items) {
    let placed = -1;
    for (let c = 0; c < columns.length; c++) {
      if (columns[c] <= item.startMin) {
        placed = c;
        break;
      }
    }
    if (placed === -1) {
      placed = columns.length;
      columns.push(0);
    }
    columns[placed] = item.endMin;
    result.push({ ...item, col: placed });
  }

  // compute totalCols for each overlap group
  // group = connected set of overlapping blocks
  const groups = [];
  let group = [];
  let groupEnd = 0;

  for (const item of result) {
    if (group.length === 0 || item.startMin < groupEnd) {
      group.push(item);
      groupEnd = Math.max(groupEnd, item.endMin);
    } else {
      groups.push(group);
      group = [item];
      groupEnd = item.endMin;
    }
  }
  if (group.length) groups.push(group);

  const final = [];
  for (const g of groups) {
    const totalCols = Math.max(...g.map((b) => b.col)) + 1;
    for (const b of g) {
      final.push({ ...b, totalCols });
    }
  }
  return final;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function ScheduleView({ tab, selectedDay, onSelectDay, onUpdateBlocks }) {
  const [editingBlock, setEditingBlock] = useState(null);
  const [newBlockId, setNewBlockId] = useState(null); // id of inline-created block
  const timelineRef = useRef(null);

  const day = tab?.days?.[selectedDay];
  const rawBlocks = day?.blocks || [];

  const blocks = useMemo(() => {
    const withDur = rawBlocks.map((b) => ({
      ...b,
      duration: b.duration || DEFAULT_DUR,
    }));

    const laid = layoutBlocks(withDur);

    return laid.map((b) => ({
      ...b,
      top: (b.startMin / 60) * HOUR_HEIGHT,
      height: Math.max((b.duration / 60) * HOUR_HEIGHT, MIN_BLOCK_H),
    }));
  }, [rawBlocks]);

  // click empty space → create block inline immediately
  const handleTimelineClick = (e) => {
    if (e.target.closest(".timeline-block")) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const min = snapMin((y / HOUR_HEIGHT) * 60);
    const time = minToTime(min);
    const id = crypto.randomUUID();

    // add block to data immediately
    const newBlock = {
      id,
      time,
      activity: "(New)",
      type: "neutral",
      icon: "\ud83d\udccc",
      duration: DEFAULT_DUR,
    };
    onUpdateBlocks(selectedDay, [...rawBlocks, newBlock]);
    setNewBlockId(id);
  };

  const handleBlockTimeChange = (blockId, newTime) => {
    const updated = rawBlocks.map((b) => (b.id === blockId ? { ...b, time: newTime } : b));
    onUpdateBlocks(selectedDay, updated);
  };

  const handleBlockResize = (blockId, newTime, newDuration) => {
    const updated = rawBlocks.map((b) =>
      b.id === blockId ? { ...b, time: newTime, duration: newDuration } : b
    );
    onUpdateBlocks(selectedDay, updated);
  };

  const handleSaveBlock = (blockData) => {
    const updated = rawBlocks.map((b) => (b.id === blockData.id ? blockData : b));
    // if block doesn't exist yet (edge case), append
    if (!rawBlocks.find((b) => b.id === blockData.id)) {
      updated.push(blockData);
    }
    onUpdateBlocks(selectedDay, updated);
    setEditingBlock(null);
    setNewBlockId(null);
  };

  const handleDeleteBlock = (blockId) => {
    onUpdateBlocks(selectedDay, rawBlocks.filter((b) => b.id !== blockId));
    setEditingBlock(null);
    setNewBlockId(null);
  };

  const handleCloseEditor = () => {
    // if closing a newly created block that wasn't saved, remove it
    if (newBlockId) {
      onUpdateBlocks(selectedDay, rawBlocks.filter((b) => b.id !== newBlockId));
      setNewBlockId(null);
    }
    setEditingBlock(null);
  };

  return (
    <div className="schedule-view">
      <PrayerBanner />
      <DaySelector selectedDay={selectedDay} onSelect={onSelectDay} />

      <div className="timeline-scroll">
        <div
          className="timeline"
          ref={timelineRef}
          style={{ height: 24 * HOUR_HEIGHT }}
          onClick={handleTimelineClick}
        >
          {HOURS.map((h) => (
            <div key={h} className="hour-row" style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}>
              <span className="hour-label">
                {`${String(h).padStart(2, "0")}:00`}
              </span>
              <div className="hour-line" />
            </div>
          ))}

          {blocks.map((block) => (
            <BlockItem
              key={block.id}
              block={block}
              top={block.top}
              height={block.height}
              col={block.col}
              totalCols={block.totalCols}
              isNew={block.id === newBlockId}
              onEdit={(b) => { setNewBlockId(null); setEditingBlock(b); }}
              onDelete={handleDeleteBlock}
              onTimeChange={handleBlockTimeChange}
              onResize={handleBlockResize}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="legend">
        <div className="legend-title">LEGEND</div>
        <div className="legend-items">
          {legendItems.map((item) => (
            <div key={item.type} className="legend-item">
              <div className="legend-dot" style={{ background: typeColors[item.type].border }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {editingBlock && (
        <BlockEditor
          block={editingBlock}
          onSave={handleSaveBlock}
          onDelete={handleDeleteBlock}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
}
