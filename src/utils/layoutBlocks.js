// Shared block layout algorithm — computes overlap columns
// Extracted from ScheduleView for reuse in DailyView

const DEFAULT_DUR = 60;

function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export { timeToMin };

export function minToTime(m) {
  m = Math.round(m);
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function snapMin(m, snap = 5) {
  return Math.max(0, Math.min(23 * 60 + 55, Math.round(m / snap) * snap));
}

/**
 * Compute overlap columns for a list of blocks.
 * Each block must have { time, duration }.
 * Returns blocks with added { startMin, endMin, col, totalCols }.
 *
 * When hourHeight and minBlockH are provided, uses visual (pixel-based)
 * overlap detection so blocks with enforced minimum heights are placed
 * side-by-side instead of stacking on top of each other.
 */
export function layoutBlocks(blocks, { hourHeight = 0, minBlockH = 0 } = {}) {
  if (!blocks.length) return [];

  // Minimum visual duration in minutes (e.g. 24px at 60px/hr = 24 min)
  const minVisualDur = (hourHeight > 0 && minBlockH > 0)
    ? (minBlockH / hourHeight) * 60
    : 0;

  const items = blocks.map((b) => {
    const s = timeToMin(b.time);
    const dur = b.duration || DEFAULT_DUR;
    const visualEnd = minVisualDur ? s + Math.max(dur, minVisualDur) : s + dur;
    return { ...b, startMin: s, endMin: s + dur, visualEnd };
  });

  items.sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin));

  const columns = [];
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
    columns[placed] = item.visualEnd;
    result.push({ ...item, col: placed });
  }

  // group connected overlapping blocks
  const groups = [];
  let group = [];
  let groupEnd = 0;

  for (const item of result) {
    if (group.length === 0 || item.startMin < groupEnd) {
      group.push(item);
      groupEnd = Math.max(groupEnd, item.visualEnd);
    } else {
      groups.push(group);
      group = [item];
      groupEnd = item.visualEnd;
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
