# Entrypoint v2 — Lock-In

A personal daily schedule planner. Block out your day on a vertical timeline, anchored to sunrise / midday / sunset / night so blocks shift with the seasons instead of drifting against a clock.

## What it does

- **Daily timeline view** — 24-hour vertical canvas, click to add blocks, drag to move, drag edges to resize, long-press on touch.
- **Time anchors** — five astronomical reference points per day (dawn, midday, afternoon, sunset, night) computed for your location. Blocks can be pinned with an offset to an anchor (e.g. "30 min after sunset") so they auto-shift across the year.
- **Plans** — multi-week routines bounded by a start/end date. Switch plans for travel, seasonal blocks, focused sprints, etc.
- **Pipelines** — collapsible kanban-style sections beneath each day for tracking ongoing work items independent of the timeline.
- **Custom block types** — extend the default palette (anchor, course, study, work, project, sport, therapy, reflect, rest, neutral) with your own colored types.
- **Tasks per block** — sub-checklists inside any block, with progress badges shown on the timeline.
- **Calendar view** — month grid showing which plan covers which day; click any cell to jump to its daily view.
- **Live "now" line** — red marker on today's timeline updating each minute.
- **Import / export** — JSON round-trip for plans, custom types, and pipeline sections.
- **Auto location detection** — geolocation + reverse geocode via OpenStreetMap; manual override available.
- **Offline-first** — full localStorage backend. Optional Firebase Auth + Firestore sync when configured.

## Stack

React 19 · Vite 6 · Firebase 12 (optional) · @dnd-kit · vanilla CSS

## Scripts

```
npm run dev       # local dev server
npm run build     # production build → dist/
npm run preview   # serve built bundle
npm run lint      # eslint
npm run deploy    # build + publish to gh-pages
```

## Config

Copy `.env.example` to `.env` and fill in Firebase keys to enable auth + cloud sync. Without those keys the app runs entirely in localStorage.

Time-anchor data comes from `api.aladhan.com` (free, no key needed) — used purely for its astronomical timings (dawn = Fajr offset, midday = solar noon, afternoon = Asr, sunset = Maghrib, night = Isha twilight).
