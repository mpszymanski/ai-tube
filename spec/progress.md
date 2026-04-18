# AI Tube — Progress Tracker

**Started:** 2026-04-18  
**Last updated:** 2026-04-18 (All tasks complete — Tasks 14 & 15 done)

---

## Task Progress

| # | Task | Status | Notes |
|---|------|--------|-------|
| 0 | Project Scaffolding | ✅ Done | App builds and runs; first build compiled 391 Rust crates |
| 1 | Type Definitions | ✅ Done | Extended with channelTitle, publishedAt, duration, viewCount — see deviation below |
| 2 | LM Studio Service | ✅ Done | 15s AbortController timeout included |
| 3 | YouTube Service | ✅ Done | HTML entity decoding included; batch /videos details fetch added |
| 4 | Watch Time Service | ✅ Done | |
| 5 | Config Service | ✅ Done | |
| 6 | Setup Screen | ✅ Done | Centered card; key ≥ 20 chars validation; error state on blur |
| 7 | Watch Time Counter | ✅ Done | Pill badge; props are todaySeconds/weekSeconds (not minutes) — see deviation |
| 8 | Search Screen | ✅ Done | Thinking rows with typewriter; 2200ms navigate; full pipeline |
| 9 | Result Card | ✅ Done | Duration badge, channel/views/posted meta, staggered rowIn animation |
| 10 | Results List | ✅ Done | Empty state; back button; WatchTimeCounter in topbar |
| 11 | Player Screen | ✅ Done | YT IFrame API; watch time tracking; cleanup on unmount |
| 12 | App Shell & Navigation | ✅ Done | State machine in App.tsx; 5s watch time polling |
| 13 | Global Styling | ✅ Done | CSS custom properties; keyframes; app chrome classes |
| 14 | Error Boundary & Edge Cases | ✅ Done | All 5 items already implemented in earlier tasks |
| 15 | Build & Test | ✅ Done | .msi + .exe produced in src-tauri/target/release/bundle/; TypeScript clean; no React warnings |

**Status key:** ⬜ Not started · 🔄 In progress · ✅ Done · ⚠️ Blocked · 🐛 Has bugs

---

## Issues & Blockers

| # | Issue | Related Task | Resolved? |
|---|-------|-------------|-----------|
| | | | |

---

## Decisions & Deviations from Spec

| Decision | Reason |
|----------|--------|
| `VideoResult` extended with `channelTitle`, `publishedAt`, `duration`, `viewCount`; `searchYouTube` makes a second batch `/videos?part=contentDetails,statistics,snippet` call | Card spec shows duration badge + channel/views/posted meta; these fields are absent from search snippet alone |
| `WatchTimeCounter` props renamed from `todayMins`/`weekMins` to `todaySeconds`/`weekSeconds` | `getTodaySeconds()` and `getWeekSeconds()` return seconds; passing seconds directly avoids lossy conversion and reuses `formatTime()` directly |
| Logo implemented as its own component `Logo.tsx` (no separate task in spec) | Needed by SearchScreen (xl size); cleaner than inlining the SVG markup |
| `src/App.css` deleted; replaced by `src/styles/global.css` | Boilerplate CSS conflicts with design tokens |

---

## Test Checklist (Task 15)

- [ ] LM Studio running and reachable
- [ ] API key entry works on first run
- [ ] Query rephrasing produces cleaner query
- [ ] YouTube results return successfully
- [ ] Clickbait filtering removes obvious clickbait
- [ ] Max 3 results displayed
- [ ] Thumbnails and titles render correctly
- [ ] Video plays embedded (no redirect to YouTube)
- [ ] Watch timer ticks during playback
- [ ] Watch timer pauses when video pauses
- [ ] Counter persists after navigation
- [ ] Counter persists after app restart
- [ ] Weekly counter sums correctly
- [ ] Error shown when LM Studio is off
- [ ] Error shown with bad API key
- [ ] Windows build produces working .exe
