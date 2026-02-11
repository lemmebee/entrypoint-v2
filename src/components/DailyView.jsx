import { useState, useRef, useMemo } from "react";
import BlockItem from "./BlockItem";
import BlockEditor from "./BlockEditor";
import PipelineSections from "./PipelineSections";
import { minTo12h } from "../utils/constants";
import { usePrayerTimes } from "../hooks/usePrayerTimes";
import { computeSegments, resolveBlockTime, SEGMENT_IDS, SEGMENT_LABELS } from "../utils/prayerSegments";
import { generatePrayerBlocks } from "./PrayerBlocks";
import { layoutBlocks, timeToMin, minToTime, snapMin } from "../utils/layoutBlocks";
import { parseISO, getDayKey, todayISO, formatDateShort, dayKeys, getWeekDate } from "../utils/dateUtils";

const HOUR_HEIGHT = 60;
const MIN_BLOCK_H = 24;
const DEFAULT_DUR = 60;

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const SEGMENT_COLORS = [
  "rgba(34, 139, 34, 0.03)",
  "rgba(34, 139, 34, 0.06)",
];

const DAY_LABELS = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

/**
 * @param {string} date - ISO date string
 * @param {object|null} plan - the plan covering this date (or null)
 * @param {function} onUpdateBlocks - (dayKey, blocks) => void
 * @param {function} onBack - return to calendar
 */
const DAY_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

export default function DailyView({
  date, plan, location, onOpenLocation, onUpdateBlocks, onMonth, onSelectDate,
  customTypes = [], customTypeColors = {}, onAddCustomType, onRemoveCustomType,
  pipelineSections = [], onAddSection, onUpdateSection, onDeleteSection,
  onToggleCollapse, onAddItem, onUpdateItem, onDeleteItem,
}) {
  const [editingBlock, setEditingBlock] = useState(null);
  const [newBlockId, setNewBlockId] = useState(null);
  const timelineRef = useRef(null);

  const dayKey = getDayKey(parseISO(date));
  const isToday = date === todayISO();

  const { times } = usePrayerTimes({ date, city: location?.city, country: location?.country, lat: location?.lat, lng: location?.lng });
  const segments = useMemo(() => computeSegments(times), [times]);
  const prayerBlocks = useMemo(() => generatePrayerBlocks(times), [times]);

  const rawBlocks = plan?.routine?.[dayKey]?.blocks || [];

  // Resolve segment-relative blocks
  const resolvedBlocks = useMemo(() => {
    return rawBlocks.map((b) => {
      if (b.segment && segments) {
        return { ...b, time: resolveBlockTime(b, segments) };
      }
      return b;
    });
  }, [rawBlocks, segments]);

  // Unified layout: prayer + user blocks together so they don't overlap
  const { userBlocks, positionedPrayers } = useMemo(() => {
    const withDur = resolvedBlocks.map((b) => ({
      ...b,
      duration: b.duration || DEFAULT_DUR,
    }));
    const allBlocks = [...prayerBlocks, ...withDur];
    const laid = layoutBlocks(allBlocks, { hourHeight: HOUR_HEIGHT, minBlockH: MIN_BLOCK_H });
    const users = [];
    const prayers = [];
    for (const b of laid) {
      const positioned = {
        ...b,
        top: (b.startMin / 60) * HOUR_HEIGHT,
        height: Math.max((b.duration / 60) * HOUR_HEIGHT, MIN_BLOCK_H),
      };
      if (b.isPrayer) prayers.push(positioned);
      else users.push(positioned);
    }
    return { userBlocks: users, positionedPrayers: prayers };
  }, [resolvedBlocks, prayerBlocks]);

  // Segment bands
  const segmentBands = useMemo(() => {
    if (!segments) return [];
    return SEGMENT_IDS.map((id, i) => {
      const seg = segments[id];
      const top = (seg.startMin / 60) * HOUR_HEIGHT;
      const height = ((seg.endMin - seg.startMin) / 60) * HOUR_HEIGHT;
      return { id, top, height, color: SEGMENT_COLORS[i % 2], label: SEGMENT_LABELS[id] };
    });
  }, [segments]);

  const handleTimelineClick = (e) => {
    if (!plan) return;
    if (e.target.closest(".timeline-block")) return;
    if (e.target.closest(".segment-label")) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const min = snapMin((y / HOUR_HEIGHT) * 60);
    const time = minToTime(min);
    const id = crypto.randomUUID();

    const newBlock = {
      id, time,
      activity: "(New)", type: "neutral", icon: "\ud83d\udccc",
      duration: DEFAULT_DUR, segment: null, offsetMinutes: 0, tasks: [],
    };
    onUpdateBlocks(dayKey, [...rawBlocks, newBlock]);
    setNewBlockId(id);
  };

  const handleBlockTimeChange = (blockId, newTime) => {
    const updated = rawBlocks.map((b) => (b.id === blockId ? { ...b, time: newTime, segment: null, offsetMinutes: 0 } : b));
    onUpdateBlocks(dayKey, updated);
  };

  const handleBlockResize = (blockId, newTime, newDuration) => {
    const updated = rawBlocks.map((b) =>
      b.id === blockId ? { ...b, time: newTime, duration: newDuration, segment: null, offsetMinutes: 0 } : b
    );
    onUpdateBlocks(dayKey, updated);
  };

  const handleSaveBlock = (blockData) => {
    let updated = rawBlocks.map((b) => (b.id === blockData.id ? blockData : b));
    if (!rawBlocks.find((b) => b.id === blockData.id)) {
      updated.push(blockData);
    }
    onUpdateBlocks(dayKey, updated);
    setEditingBlock(null);
    setNewBlockId(null);
  };

  const handleDeleteBlock = (blockId) => {
    onUpdateBlocks(dayKey, rawBlocks.filter((b) => b.id !== blockId));
    setEditingBlock(null);
    setNewBlockId(null);
  };

  const handleToggleTask = (blockId, taskId) => {
    const updated = rawBlocks.map((b) => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        tasks: (b.tasks || []).map((t) =>
          t.id === taskId ? { ...t, done: !t.done } : t
        ),
      };
    });
    onUpdateBlocks(dayKey, updated);
  };

  const handleCloseEditor = () => {
    if (newBlockId) {
      onUpdateBlocks(dayKey, rawBlocks.filter((b) => b.id !== newBlockId));
      setNewBlockId(null);
    }
    setEditingBlock(null);
  };

  // "Now" line (only shown if viewing today)
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMin / 60) * HOUR_HEIGHT;

  return (
    <div className="daily-view">
      {/* Day header with back button */}
      <div className="daily-header">
        <button className="daily-back" onClick={onMonth}>&lsaquo; Month</button>
        <div className="daily-date-info">
          <span className="daily-day-name">{DAY_LABELS[dayKey]}</span>
          <span className="daily-date-str">{formatDateShort(date)}{isToday ? " (today)" : ""}</span>
        </div>
        {plan && (
          <span className="daily-plan-badge" style={{ borderColor: plan.color, color: plan.color }}>
            {plan.label}
          </span>
        )}
      </div>

      {/* Day-of-week selector */}
      <div className="day-selector">
        {dayKeys.map((dk, i) => (
          <button
            key={dk}
            className={`day-btn${dk === dayKey ? " active" : ""}`}
            onClick={() => onSelectDate(getWeekDate(date, dk))}
          >
            {DAY_SHORT[i]}
          </button>
        ))}
      </div>

      {/* Prayer times */}
      {times && (
        <div className="prayer-banner">
          <div className="prayer-banner-title" onClick={onOpenLocation} style={{ cursor: "pointer" }}>
            PRAYER TIMES{location?.city ? ` — ${location.city.toUpperCase()}` : ""}
          </div>
          <div className="prayer-times-row">
            {Object.entries(times).map(([name, time]) => (
              <div key={name} className="prayer-time-item">
                <span className="prayer-name">{name}</span>
                <span className="prayer-time">{time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!plan && (
        <div className="daily-empty">
          No plan covers this date. Create a plan that includes {formatDateShort(date)}.
        </div>
      )}

      {plan && rawBlocks.length === 0 && (
        <div className="daily-hint">
          Tap the timeline to add your first block for {DAY_LABELS[dayKey]}.
        </div>
      )}

      <div className="timeline-scroll">
        <div
          className="timeline"
          ref={timelineRef}
          style={{ height: 24 * HOUR_HEIGHT }}
          onClick={handleTimelineClick}
        >
          {segmentBands.map((band) => (
            <div
              key={band.id}
              className="segment-band"
              style={{ top: band.top, height: band.height, background: band.color }}
            >
              <span className="segment-label">{band.label}</span>
            </div>
          ))}

          {HOURS.map((h) => (
            <div key={h} className="hour-row" style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}>
              <span className="hour-label">{minTo12h(h * 60)}</span>
              <div className="hour-line" />
            </div>
          ))}

          {isToday && (
            <div className="now-line" style={{ top: nowTop }}>
              <div className="now-dot" />
            </div>
          )}

          {positionedPrayers.map((block) => (
            <BlockItem
              key={block.id}
              block={block}
              top={block.top}
              height={block.height}
              col={block.col}
              totalCols={block.totalCols}
              isPrayer
              onEdit={() => {}}
              onDelete={() => {}}
              onTimeChange={() => {}}
              onResize={() => {}}
            />
          ))}

          {userBlocks.map((block) => (
            <BlockItem
              key={block.id}
              block={block}
              top={block.top}
              height={block.height}
              col={block.col}
              totalCols={block.totalCols}
              isNew={block.id === newBlockId}
              extraTypeColors={customTypeColors}
              onEdit={(b) => { setNewBlockId(null); setEditingBlock(b); }}
              onDelete={handleDeleteBlock}
              onTimeChange={handleBlockTimeChange}
              onResize={handleBlockResize}
              onToggleTask={handleToggleTask}
            />
          ))}
        </div>
      </div>

      <PipelineSections
        sections={pipelineSections}
        addSection={onAddSection}
        updateSection={onUpdateSection}
        deleteSection={onDeleteSection}
        toggleCollapse={onToggleCollapse}
        addItem={onAddItem}
        updateItem={onUpdateItem}
        deleteItem={onDeleteItem}
      />

      {editingBlock && (
        <BlockEditor
          key={editingBlock.id + editingBlock.time + (editingBlock.duration || 0)}
          block={editingBlock}
          segments={segments}
          customTypes={customTypes}
          customTypeColors={customTypeColors}
          onAddCustomType={onAddCustomType}
          onRemoveCustomType={onRemoveCustomType}
          onSave={handleSaveBlock}
          onDelete={handleDeleteBlock}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
}
