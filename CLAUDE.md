# AI Tube — Claude Instructions

## Project Overview

AI Tube is a Tauri desktop app (React + TypeScript + Vite) that provides a curated YouTube browsing experience. It uses a locally-managed Ollama model to analyze search intent and filter clickbait, and the YouTube Data API v3 to fetch videos and channels. The app auto-downloads and starts the AI model on launch via Tauri commands.

## Architecture

### Screen flow

```
Setup → Search → Results          → Player → Results
                 ChannelResults   → Player → ChannelResults
                 Subscriptions    → Player → ChannelResults
```

`App.tsx` manages a single `AppScreen` state value and renders one screen at a time (no router):

| Screen | Component | Triggered by |
|--------|-----------|--------------|
| `"setup"` | `SetupScreen` | First launch / settings button |
| `"search"` | `SearchScreen` | App start / back from results |
| `"results"` | `ResultsList` | Video search completes |
| `"channel-results"` | `ChannelResultsScreen` | Channel search completes |
| `"player"` | `PlayerScreen` | User clicks a video |
| `"subscriptions"` | `SubscriptionsScreen` | User opens subscriptions |

### App bootstrap sequence

1. Hydrate all storage (config, watch time, subscriptions, API usage, seen videos)
2. Check if model exists locally → download if missing → start Ollama server
3. Render `SetupScreen` (if no API key) or `SearchScreen` (if configured)

A model status banner is shown during download/start phases.

### Search intent model

`analyzeQuery()` in `src/services/lmStudio.ts` calls the local Ollama model and returns:

```typescript
{ videoQuery: string; intent: SearchIntent; channelName?: string; timePeriod?: TimePeriod }
```

| `intent` | Meaning | Flow |
|----------|---------|------|
| `"videos"` | Generic video search | `searchYouTube(query)` → `ResultsList` |
| `"channel-videos"` | Videos from a specific channel | Channel lookup → `searchYouTube(query, channelId)` → `ResultsList` |
| `"channel"` | Browse a channel's latest videos | Channel lookup → `getChannelLatestVideos(channelId)` → `ChannelResultsScreen` |

When multiple channels match a name, `SearchScreen` enters a `"channel-confirm"` phase where the user picks one before the search continues.

### Clickbait filtering

After any video fetch, titles are sent to `classifyClickbait()` (also via the local model). Results get an `isClickbait` flag. Both `ResultsList` and `ChannelResultsScreen` have a toggle to show/hide clickbait results (default: on).

### Watch limits

`AppConfig` stores `dailyLimitSeconds` and `weeklyLimitSeconds`. When either limit is exceeded, `WatchLimitContext` sets `isLocked: true`, which disables search and shows a lock indicator. `SetupScreen` lets the user adjust limits.

### Persistence

State is stored in Tauri file storage (`AppData/aitube/*.json`) via `StorageAdapter`, except search history which uses `localStorage` directly.

| Key | Service | Content |
|-----|---------|---------|
| `aitube_config` | `src/services/config.ts` | `{ youtubeApiKey, dailyLimitSeconds, weeklyLimitSeconds }` |
| `aitube_watch_time` | `src/services/watchTime.ts` | `{ daily: Record<YYYY-MM-DD, seconds> }` |
| `aitube_subscriptions` | `src/services/subscriptions.ts` | `ChannelResult[]` |
| `aitube_api_quota` | `src/services/apiUsage.ts` | `{ date, units }` (max 10,000/day) |
| `aitube_seen_videos` | `src/services/seenVideos.ts` | `string[]` (video IDs) |
| `aitube_search_history` | `src/services/searchHistory.ts` | `string[]` (max 15 queries, localStorage) |

Watch time is pruned to the last 7 days on read and flushed to storage with a 5-second debounce.

## File Map

```
src/
  App.tsx                         — screen state machine, model bootstrap, top-level handlers
  main.tsx                        — React entry point
  types/index.ts                  — all shared types and interfaces
  context/
    WatchLimitContext.tsx          — global watch limit state (isLocked, limits, onSettings)
  services/
    config.ts                     — read/write app config
    lmStudio.ts                   — analyzeQuery(), classifyClickbait(), groupVideosByTopic()
    youtube.ts                    — searchChannels(), searchYouTube(), getChannelLatestVideos()
    watchTime.ts                  — watch time tracking, formatting, debounced flush
    subscriptions.ts              — subscribe/unsubscribe with observer pattern
    apiUsage.ts                   — YouTube API quota tracking (100 units/call, 10k/day max)
    seenVideos.ts                 — persist and hydrate set of watched video IDs
    searchHistory.ts              — query history (localStorage, max 15 items)
    modelDownloader.ts            — Tauri bridge: check/download Ollama model
    modelServer.ts                — Tauri bridge: start server, poll health endpoint
    storage/
      adapter.ts                  — StorageAdapter interface + KEYS constants
      index.ts                    — getAdapter() / setAdapter()
      TauriFileAdapter.ts         — reads/writes AppData/aitube/*.json via Tauri FS plugin
      InMemoryAdapter.ts          — in-memory adapter for tests
  components/
    screens/                      — full-screen views, one per AppScreen state
      SetupScreen.tsx             — API key + watch limit configuration form
      SearchScreen.tsx            — orchestrates idle/thinking/channel-confirm phases
      SearchIdleView.tsx          — search input, history dropdown, subscriptions quick-access
      SearchThinkingView.tsx      — animated ThinkingRow steps during query analysis
      ChannelConfirmView.tsx      — channel disambiguation when multiple channels match
      ResultsList.tsx             — generic video search results + clickbait toggle
      ChannelResultsScreen.tsx    — channel card + latest videos + subscribe button
      PlayerScreen.tsx            — YouTube iframe player + watch time tracking
      SubscriptionsScreen.tsx     — subscribed channel list with browse and remove actions
    layout/
      ScreenShell.tsx             — app shell: topbar (BackButton + SettingsButton + WatchTimeCounter) + main area
    ui/                           — generic, reusable primitives (no domain knowledge)
      BackButton.tsx              — back navigation button
      EmptyState.tsx              — empty/zero-results placeholder with icon + message
      Icons.tsx                   — SVG icon components (ClipboardIcon, CheckIcon, CogIcon)
      Logo.tsx                    — app logo (sizes: sm / lg / xl)
      SettingsButton.tsx          — cog icon button that calls onSettings() from WatchLimitContext
      ThinkingRow.tsx             — labelled progress row (pending/done states)
      Toggle.tsx                  — clickbait filter toggle switch
    widgets/                      — domain-aware components, reusable across screens
      ResultCard.tsx              — video card with thumbnail, metadata, seen badge, copy-link
      SubscribeButton.tsx         — subscribe/unsubscribe toggle for a channel
      WatchTimeCounter.tsx        — today/week watch time pill with lock indicator (top-right)
  utils/
    constants.ts                  — ANIMATION_DELAYS (10 staggered delay values)
    formatters.ts                 — formatDuration(), formatViewCount(), formatPublishedAt()
  styles/global.css               — design tokens (CSS vars), global resets, animations
```

## Key Types

```typescript
type AppScreen = "setup" | "search" | "results" | "channel-results" | "player" | "subscriptions";
type SearchIntent = "videos" | "channel" | "channel-videos";
type TimePeriod = "today" | "this_week" | "this_month" | "this_year";

interface VideoResult {
  videoId, title, thumbnailUrl, channelTitle,
  channelId?, channelThumbnailUrl?,
  publishedAt, duration, viewCount, isClickbait?
}
interface ChannelResult { channelId, title, thumbnailUrl, description }
interface ChannelResultWithVideos { channel: ChannelResult; latestVideos: VideoResult[] }
interface AppConfig { youtubeApiKey: string; dailyLimitSeconds: number; weeklyLimitSeconds: number }
```

## Design Conventions

- **No routing library** — screen state is a simple string in `App.tsx`
- **Inline styles only** — no CSS modules; design tokens via `var(--token)` from `global.css`
- **No external UI libraries** — all components are bespoke
- **Model fallbacks** — if the local model is unreachable, `analyzeQuery` falls back to the raw query with `intent: "videos"`; `classifyClickbait` marks all titles as non-clickbait
- **Results always sorted newest-first**, limited to 10 per search
- **`ResultCard` is shared** between `ResultsList` and `ChannelResultsScreen`
- **Model endpoint** is hardcoded to `http://localhost:11434` (Ollama-compatible API); model name is `Qwen3-4B-Instruct-2507-Q8_0`

## Dev

```bash
npm run dev          # Vite dev server (browser only, no Tauri)
npm run build        # TypeScript + Vite production build
npm run tauri:dev    # Run as Tauri desktop app (dev mode)
npm run tauri:build  # Build Tauri desktop app
npm test             # Vitest (watch mode)
npm run test:run     # Vitest (single run)
npx tsc --noEmit     # Type check only
```

Requires a YouTube Data API v3 key. The Ollama model is auto-downloaded on first launch when running as a Tauri app.
