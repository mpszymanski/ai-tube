# AI Tube — Project Specification

**Version:** 1.0  
**Date:** April 18, 2026

---

## 1. Overview

AI Tube is a lightweight, privacy-first desktop application that uses a locally-running LLM (via LM Studio) to transform raw user input into optimized YouTube search queries, fetch results, filter out clickbait, and present up to 3 clean results with embedded video playback — all without ever opening YouTube directly in a browser.

A built-in watch-time tracker logs daily and weekly video consumption, stored locally.

---

## 2. Goals

- Provide a distraction-free, minimal interface for finding YouTube content.
- Use a local LLM to rephrase vague or conversational input into precise search queries.
- Automatically filter out clickbait results before presenting them to the user.
- Embed video playback inside the app so the user never navigates to YouTube.
- Track time spent watching videos (daily and weekly counters).
- Run entirely locally — no cloud dependencies beyond YouTube's public API.

---

## 3. Architecture

```
┌─────────────────────────────────────────────────┐
│              Tauri (native shell)                │
│  ┌───────────────────────────────────────────┐   │
│  │           React Frontend (WebView)        │   │
│  │                                           │   │
│  │  [Search Input] → fetch LM Studio API     │   │
│  │       ↓                                   │   │
│  │  Rephrased query → YouTube Data API v3    │   │
│  │       ↓                                   │   │
│  │  Raw results → fetch LM Studio API        │   │
│  │       ↓                                   │   │
│  │  Filtered results (max 3) → display       │   │
│  │       ↓                                   │   │
│  │  Click → embedded YouTube player          │   │
│  │       ↓                                   │   │
│  │  Watch timer → localStorage               │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
         ↕                        ↕
   LM Studio API          YouTube Data API v3
   localhost:1234          googleapis.com
```

### 3.1 Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Native shell   | Tauri v2 (Rust)                     |
| Frontend       | React 18 + TypeScript               |
| Styling        | Tailwind CSS or plain CSS modules   |
| LLM backend    | LM Studio (local, OpenAI-compatible API at `localhost:1234`) |
| Video data     | YouTube Data API v3                 |
| Video playback | YouTube IFrame Player API (embedded)|
| Persistence    | localStorage (watch time tracking)  |
| Build/bundle   | Vite                                |

### 3.2 Recommended Local Model

Any of the following, loaded in LM Studio:

| Model              | Size   | Why                                          |
|--------------------|--------|----------------------------------------------|
| Phi-4-mini (3.8B)  | ~2 GB  | Fastest; sufficient for rewrite + classify   |
| Gemma 4 E4B        | ~3 GB  | Strong instruction-following, multimodal      |
| Qwen 3.5 7B        | ~5 GB  | Best quality for clickbait detection          |

The task (query rewriting + binary clickbait classification) is lightweight — a small model is preferred for speed.

---

## 4. User Interface

### 4.1 Search Screen (Home)

```
┌──────────────────────────────────┐
│                        [0h 12m] │  ← watch time (top-right corner)
│                                  │
│                                  │
│            🎬 AI Tube            │  ← logo / title, centered
│                                  │
│   ┌──────────────────────────┐   │
│   │ What do you want to watch│   │  ← text input with placeholder
│   └──────────────────────────┘   │
│                                  │
│                                  │
└──────────────────────────────────┘
```

- Centered logo "AI Tube" (xl size) — original red rounded-rect mark with inline SVG play glyph + two-tone wordmark ("AI" white, "Tube" dimmed). Not a recreation of any existing brand.
- Single text input below the logo (max-width 620px). Search triggers on Enter only (no button).
- While the pipeline runs, the search form is replaced by a **thinking state**: three animated rows ("You" / "Rephrase" / "Search") that appear sequentially. The "Rephrase" row types out the AI's rewritten query character-by-character before navigating to results after 2200ms total.
- Watch-time counter pill in the top-right corner (all post-setup screens).

### 4.2 Results Screen

```
┌──────────────────────────────────┐
│  ← Back                [0h 12m] │
│                                  │
│  ┌────────┐                      │
│  │ thumb  │  Title of Video 1    │
│  └────────┘                      │
│  ┌────────┐                      │
│  │ thumb  │  Title of Video 2    │
│  └────────┘                      │
│  ┌────────┐                      │
│  │ thumb  │  Title of Video 3    │
│  └────────┘                      │
│                                  │
└──────────────────────────────────┘
```

- Maximum 3 results displayed, max-width 640px.
- Each result card: thumbnail 168×94px + title (14.5px, 2-line clamp) + meta line (channel · views · posted).
- Duration badge overlaid on bottom-right of thumbnail.
- Cards animate in with staggered `rowIn` fade+slide (delays: 0.05s, 0.12s, 0.19s).
- Clicking a result opens the Player Screen.
- Back button (arrow icon + "Back" label) returns to the Search Screen.

### 4.3 Player Screen

```
┌──────────────────────────────────┐
│  ← Back                [0h 15m] │
│                                  │
│  ┌──────────────────────────┐    │
│  │                          │    │
│  │    YouTube IFrame        │    │
│  │    Embedded Player       │    │
│  │                          │    │
│  └──────────────────────────┘    │
│                                  │
│  Video Title Here                │
│                                  │
└──────────────────────────────────┘
```

- Embedded YouTube player via IFrame Player API — video plays inside the app. Max-width 760px, 16:9 aspect-ratio container.
- Play button (68×48px pill) centered over video before playback starts; controls bar overlaid at the bottom while playing (visible on hover/focus-within).
- Video title (20px) and meta (channel · views · posted) displayed below the player.
- Watch timer starts counting when video plays, pauses when video pauses.
- Back button (arrow icon + "Back" label) returns to Results Screen.

---

## 5. Core Logic

### 5.1 Query Rewriting (LLM Call 1)

**Endpoint:** `POST http://localhost:1234/v1/chat/completions`

**System prompt:**

```
You are a search query optimizer. The user will give you a casual description
of what they want to watch. Your job is to produce a short, precise YouTube
search query (3-8 words). Rules:
- Remove filler words, opinions, and vagueness.
- Use specific, factual keywords.
- Output ONLY the search query, nothing else.
```

**Example:**

| User input                                          | Model output                    |
|-----------------------------------------------------|---------------------------------|
| "I want to learn how to make bread at home easily"  | "homemade bread tutorial easy"  |
| "something funny with cats doing weird stuff"       | "funny cats compilation"        |
| "that new sci fi movie everyone is talking about"   | "new sci-fi movie 2026 trailer" |

### 5.2 YouTube Search

**Endpoint:** `GET https://www.googleapis.com/youtube/v3/search`

**Parameters:**

| Parameter  | Value                            |
|------------|----------------------------------|
| `part`     | `snippet`                        |
| `q`        | rephrased query from step 5.1    |
| `type`     | `video`                          |
| `maxResults` | `10` (fetch more than needed to allow filtering) |
| `key`      | YouTube Data API v3 key (stored locally in app config) |

**Response fields used:**

- `items[].id.videoId` — for embedding
- `items[].snippet.title` — display title
- `items[].snippet.thumbnails.medium.url` — thumbnail image

### 5.3 Clickbait Filtering (LLM Call 2)

**Endpoint:** `POST http://localhost:1234/v1/chat/completions`

**System prompt:**

```
You are a clickbait detector. You will receive a JSON array of YouTube video
titles. For each title, determine if it is clickbait. Clickbait indicators:
- ALL CAPS words used for emphasis (e.g., "You WON'T BELIEVE")
- Vague teasers that withhold information (e.g., "What happens next will shock you")
- Exaggerated superlatives (e.g., "THE BEST EVER", "INSANE", "DESTROYED")
- Emotional manipulation (e.g., "This made me cry")
- Misleading curiosity gaps (e.g., "Doctors don't want you to know this")
- Excessive punctuation (!!!, ???)

Respond ONLY with a JSON array of objects: [{"title": "...", "clickbait": true/false}]
No additional text.
```

**Post-processing:**

- Filter out titles where `clickbait === true`.
- Take the first 3 remaining results.
- If fewer than 3 remain after filtering, display whatever is left (1 or 2).

### 5.4 Pipeline Summary

```
User input
  → LLM call 1: rewrite into search query
  → YouTube API: fetch 10 results
  → LLM call 2: classify each title as clickbait or not
  → Take first 3 non-clickbait results
  → Display
```

---

## 6. Watch Time Tracker

### 6.1 Storage Schema (localStorage)

```json
{
  "aitube_watch_time": {
    "daily": {
      "2026-04-18": 720
    },
    "sessions": []
  }
}
```

- Values are in **seconds**.
- Daily entries are keyed by ISO date string (`YYYY-MM-DD`).
- Old entries beyond 7 days can be pruned on app launch.

### 6.2 Tracking Logic

- **Start timer** when YouTube IFrame Player API fires `onStateChange` → `PLAYING`.
- **Pause timer** on `PAUSED`, `BUFFERING`, or `ENDED`.
- **Accumulate** elapsed seconds into `daily[today]` every second (or on pause/stop).
- **Persist** to localStorage on every pause and on a 30-second interval as a safety net.

### 6.3 Display

- **Top-right corner**, always visible on all screens.
- Format: `Today: Xh Ym | Week: Xh Ym`
- Weekly total = sum of the last 7 days of daily entries.
- Clicking the counter could optionally expand to show a daily breakdown (nice-to-have).

---

## 7. Configuration

The app needs two configurable values. Store in a local config file or a settings screen:

| Setting             | Default                  | Notes                          |
|---------------------|--------------------------|--------------------------------|
| `LM_STUDIO_URL`     | `http://localhost:1234`  | LM Studio API base URL         |
| `YOUTUBE_API_KEY`    | (none, user must provide)| YouTube Data API v3 key         |

### 7.1 First-Run Setup

On first launch, if `YOUTUBE_API_KEY` is not set, show a simple setup screen:

```
Welcome to AI Tube

To get started, enter your YouTube API key:
[______________________________]
[Save & Continue]

(Get a free key at console.cloud.google.com)
```

---

## 8. Error Handling

| Scenario                        | Behavior                                                 |
|---------------------------------|----------------------------------------------------------|
| LM Studio not running           | Show: "Cannot reach LM Studio. Make sure it's running at localhost:1234." |
| LM Studio returns malformed JSON| Fall back: use original user input as the search query.   |
| YouTube API error / quota hit    | Show: "YouTube search failed. Check your API key or try again later." |
| No results after filtering       | Show: "No results found. Try a different search."         |
| Network offline                  | Show: "No internet connection. YouTube search requires internet." |

---

## 9. Project Structure

```
ai-tube/
├── src-tauri/           # Tauri config and Rust entry point
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       └── main.rs
├── src/                 # React frontend
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── SearchScreen.tsx
│   │   ├── ResultsList.tsx
│   │   ├── ResultCard.tsx
│   │   ├── PlayerScreen.tsx
│   │   ├── WatchTimeCounter.tsx
│   │   └── SetupScreen.tsx
│   ├── services/
│   │   ├── lmStudio.ts       # LLM API calls (rewrite + filter)
│   │   ├── youtube.ts        # YouTube Data API calls
│   │   └── watchTime.ts      # localStorage read/write/timer logic
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── global.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 10. Build & Distribution

### 10.1 Development

```bash
npm install
npm run tauri dev        # launches app with hot reload
```

### 10.2 Production Build

```bash
npm run tauri build      # produces .exe installer + portable .exe
```

Output: `src-tauri/target/release/bundle/` contains:

- `.msi` installer for Windows
- Portable `.exe`

### 10.3 Prerequisites for End User

- **LM Studio** installed and running with a model loaded.
- **YouTube Data API v3 key** (free tier: 10,000 units/day ≈ ~100 searches/day).
- **Windows 10/11** with WebView2 runtime (included in Windows 11, auto-installed by Tauri on Windows 10).

---

## 11. Future Enhancements (Out of Scope for v1)

- **Watch history** — log which videos were watched with timestamps.
- **Daily time limit** — optional alert or block after X minutes per day.
- **Multiple search providers** — add Vimeo, PeerTube, etc.
- **Model selection** — dropdown to pick which LM Studio model to use.
- **Keyboard shortcuts** — Escape to go back, Enter to search.
- **Dark/light theme toggle.**
- **Export watch time data** to CSV.
