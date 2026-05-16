<div align="center">

# 🚀 Entrypoint v2 — Lock-In

**A timeline-first daily planner anchored to the sun, not the clock.**

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-12-ffca28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

</div>

---

## Why

Calendars assume your day is a list of meetings. It isn't. Real days are **continuous time** punctuated by a few hard astronomical anchors (sunrise, midday, sunset) that drift week-by-week with the seasons. This app gives you a single vertical timeline where you sketch your day in colored blocks, optionally pinned with an offset to a sun-anchor so the routine **auto-shifts** as days lengthen and shorten.

## Features

| | |
|---|---|
| 🕒 **24-hour timeline** | Click empty space to add a block. Drag the body to move, drag edges to resize. 5-min snap. Long-press on touch. |
| ☀️ **Sun-anchored blocks** | Pin a block to *dawn / midday / afternoon / sunset / night* with a minute offset. Block shifts automatically as anchor times move across the year. |
| 🗂️ **Plans** | Multi-week routines bounded by start/end dates. Switch between them for seasonal phases, travel, sprints. |
| 🧱 **Pipelines** | Collapsible kanban-style sections beneath the day for ongoing work items independent of the timeline. |
| 🎨 **Custom block types** | Default palette (anchor, course, study, work, project, sport, therapy, reflect, rest, neutral) is extendable with your own colors. |
| ✅ **Per-block tasks** | Sub-checklists inside any block. Live progress badges shown on the timeline. |
| 📅 **Month calendar** | Grid view colored by active plan. Click any day to jump to its timeline. |
| 🔴 **Live "now" line** | Red marker on today's timeline, ticks every minute. |
| 📦 **Import / export** | JSON round-trip for plans, custom types, and pipelines. |
| 📍 **Auto location** | Geolocation + reverse-geocode (OpenStreetMap Nominatim). Manual override modal as fallback. |
| 💾 **Offline-first** | Pure localStorage by default. Optional Firebase Auth + Firestore sync when keys are configured. |
| 📱 **Touch-tuned** | iOS-safe input sizing (no auto-zoom), long-press drag activation to preserve scroll. |

## Stack

`React 19` · `Vite 6` · `@dnd-kit` · `Firebase 12` *(optional)* · vanilla CSS · no UI framework

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

| Script | What |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production bundle → `dist/` |
| `npm run preview` | Serve built bundle |
| `npm run lint` | ESLint |
| `npm run deploy` | Build + publish to gh-pages |

## Configuration

Copy `.env.example` → `.env`, fill in Firebase keys to enable auth + cloud sync. Without those keys the app is entirely client-side (localStorage).

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
# etc.
```

Sun-anchor times are fetched from `api.aladhan.com` (free, no key) for purely astronomical reasons — it returns reliable per-location dawn / solar-noon / mid-afternoon / sunset / dusk timings derived from latitude, longitude, and date.

## Architecture

```
src/
├── App.jsx                 # top-level router (calendar | daily | modals)
├── components/
│   ├── DailyView.jsx       # 24h timeline + anchor banner + pipelines
│   ├── CalendarView.jsx    # month grid
│   ├── BlockItem.jsx       # draggable / resizable block
│   ├── BlockEditor.jsx     # modal: edit block + tasks + custom types
│   ├── AnchorBanner.jsx    # top strip showing today's sun-anchor times
│   └── AnchorBlocks.jsx    # generates immovable anchor blocks from times
├── hooks/
│   ├── usePlans.jsx        # localStorage ⇄ Firestore plans CRUD
│   ├── useAnchorTimes.jsx  # fetch + cache sun-anchor times
│   ├── useLocation.jsx     # geolocate + reverse-geocode
│   └── usePipelines.jsx    # kanban sections CRUD
└── utils/
    ├── anchorSegments.js   # build 6 day-segments from anchor times
    ├── layoutBlocks.js     # overlap-aware column layout
    ├── dateUtils.js        # ISO helpers, week math, API formatting
    └── constants.jsx       # type palette, plan colors, day keys
```

Data flows one way: hooks own state + persistence, components are pure render + dispatch.

## License

MIT — see [LICENSE](./LICENSE).
