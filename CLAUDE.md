# AI Tube — Claude Instructions

## Project Overview

AI Tube is a React + TypeScript (Vite) app that provides a curated YouTube browsing experience. It uses a local LM Studio instance to analyze search intent and filter clickbait, and the YouTube Data API v3 to fetch videos and channels.

## Architecture

### Screen flow

```
Setup → Search → Results       → Player → Results
                 ChannelResults → Player → ChannelResults
```

`App.tsx` manages a single `AppScreen` state value and renders one screen at a time (no router):

| Screen | Component | Triggered by |
|--------|-----------|--------------|
| `"setup"` | `SetupScreen` | First launch, no API key saved |
| `"search"` | `SearchScreen` | App start / back from results |
| `"results"` | `ResultsList` | Video search completes |
| `"channel-results"` | `ChannelResultsScreen` | Channel search completes |
| `"player"` | `PlayerScreen` | User clicks a video |

### Search intent model

`analyzeQuery()` in `src/services/lmStudio.ts` calls a local LM Studio model and returns:

```typescript
{ videoQuery: string; intent: SearchIntent; channelName?: string }
```

| `intent` | Meaning | Flow |
|----------|---------|------|
| `"videos"` | Generic video search | `searchYouTube(query)` → `ResultsList` |
| `"channel-videos"` | Videos from a specific channel | Channel lookup → `searchYouTube(query, channelId)` → `ResultsList` |
| `"channel"` | Browse a channel's latest videos | Channel lookup → `getChannelLatestVideos(channelId)` → `ChannelResultsScreen` |

When multiple channels match a name, `SearchScreen` enters a `"channel-confirm"` phase where the user picks one before the search continues.

### Clickbait filtering

After any video fetch, titles are sent to `classifyClickbait()` (also via LM Studio). Results get an `isClickbait` flag. Both `ResultsList` and `ChannelResultsScreen` have a toggle to show/hide clickbait results (default: on).

### Persistence

All state is in `localStorage`:

| Key | Service | Content |
|-----|---------|---------|
| `aitube_config` | `src/services/config.ts` | `{ lmStudioUrl, youtubeApiKey }` |
| `aitube_watch_time` | `src/services/watchTime.ts` | `{ daily: Record<YYYY-MM-DD, seconds> }` |

Watch time is tracked in `PlayerScreen` and pruned to the last 7 days on read.

## File Map

```
src/
  App.tsx                         — screen state machine, top-level handlers
  types/index.ts                  — all shared types and interfaces
  services/
    config.ts                     — read/write app config (localStorage)
    lmStudio.ts                   — analyzeQuery(), classifyClickbait()
    youtube.ts                    — searchChannels(), searchYouTube(), getChannelLatestVideos()
    watchTime.ts                  — watch time tracking and formatting
  components/
    SetupScreen.tsx               — initial API key configuration form
    SearchScreen.tsx              — search input, thinking UI, channel-confirm UI
    ResultsList.tsx               — generic video search results + clickbait toggle
    ChannelResultsScreen.tsx      — channel card on top + latest videos list
    ResultCard.tsx                — individual video card (reused in both result screens)
    PlayerScreen.tsx              — YouTube iframe player + watch time tracking
    Logo.tsx                      — app logo (sizes: sm / lg / xl)
    Toggle.tsx                    — clickbait filter toggle switch
    WatchTimeCounter.tsx          — today/week watch time display (top-right)
  styles/global.css               — design tokens (CSS vars), global resets, animations
```

## Key Types

```typescript
type AppScreen = "setup" | "search" | "results" | "channel-results" | "player";
type SearchIntent = "videos" | "channel" | "channel-videos";

interface VideoResult { videoId, title, thumbnailUrl, channelTitle, publishedAt, duration, viewCount, isClickbait? }
interface ChannelResult { channelId, title, thumbnailUrl, description }
interface ChannelResultWithVideos { channel: ChannelResult; latestVideos: VideoResult[] }
interface AppConfig { lmStudioUrl: string; youtubeApiKey: string }
```

## Design Conventions

- **No routing library** — screen state is a simple string in `App.tsx`
- **Inline styles only** — no CSS modules; design tokens via `var(--token)` from `global.css`
- **No external UI libraries** — all components are bespoke
- **LM Studio fallbacks** — if the local model is unreachable, `analyzeQuery` falls back to the raw query with `intent: "videos"`; `classifyClickbait` marks all titles as non-clickbait
- **Results always sorted newest-first**, limited to 10 per search
- **`ResultCard` is shared** between `ResultsList` and `ChannelResultsScreen`

## Dev

```bash
npm run dev    # Vite dev server
npm run build  # Production build
npx tsc --noEmit  # Type check only
```

Requires a YouTube Data API v3 key and a running LM Studio instance (default: `http://localhost:1234`).
