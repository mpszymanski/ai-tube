# AI Tube — Claude Code Task List

Each task is self-contained with clear inputs, outputs, and acceptance criteria. Work through them in order — later tasks depend on earlier ones.

---

## Task 0: Project Scaffolding

**Goal:** Initialize the project with Tauri v2 + React + TypeScript + Vite.

**Steps:**
1. Run `npm create tauri-app@latest ai-tube` — select React + TypeScript + Vite.
2. Verify the scaffold runs with `npm install && npm run tauri dev`.
3. Clean out boilerplate: remove default Vite/React starter content from `App.tsx`, leave a blank `<div>AI Tube</div>`.
4. Set up the folder structure inside `src/`:

```
src/
├── components/
├── services/
├── types/
└── styles/
```

5. In `src-tauri/tauri.conf.json`, set:
   - `productName`: `"AI Tube"`
   - `title`: `"AI Tube"`
   - `width`: 800, `height`: 600
   - `resizable`: true

**Done when:** `npm run tauri dev` opens a native window titled "AI Tube" with a blank page showing "AI Tube".

---

## Task 1: Type Definitions

**Goal:** Create shared TypeScript types used across the app.

**File:** `src/types/index.ts`

**Define these types:**

```typescript
// A single YouTube search result after processing
interface VideoResult {
  videoId: string;
  title: string;
  thumbnailUrl: string;
}

// Watch time storage shape in localStorage
interface WatchTimeData {
  daily: Record<string, number>; // key: "YYYY-MM-DD", value: seconds
}

// App configuration
interface AppConfig {
  lmStudioUrl: string;
  youtubeApiKey: string;
}

// App view/screen state
type AppScreen = "setup" | "search" | "results" | "player";
```

Export all types.

**Done when:** Types compile with no errors and are importable from other files.

---

## Task 2: LM Studio Service

**Goal:** Create the service that talks to LM Studio's local API for query rewriting and clickbait filtering.

**File:** `src/services/lmStudio.ts`

**Implement two functions:**

### `rephraseQuery(userInput: string, apiUrl: string): Promise<string>`

- POST to `{apiUrl}/v1/chat/completions`
- Model: use whatever LM Studio has loaded (pass `"model": "local-model"` — LM Studio ignores this field and uses the loaded model)
- System prompt:
  ```
  You are a search query optimizer. The user will give you a casual description of what they want to watch. Your job is to produce a short, precise YouTube search query (3-8 words). Rules:
  - Remove filler words, opinions, and vagueness.
  - Use specific, factual keywords.
  - Output ONLY the search query, nothing else. No quotes, no explanation.
  ```
- User message: the raw `userInput`
- `max_tokens`: 50, `temperature`: 0.3
- Return the trimmed text content from the response.
- On error: return the original `userInput` as fallback (so the pipeline still works).

### `filterClickbait(titles: string[], apiUrl: string): Promise<string[]>`

- POST to `{apiUrl}/v1/chat/completions`
- System prompt:
  ```
  You are a clickbait detector. You will receive a JSON array of YouTube video titles. For each title, determine if it is clickbait. Clickbait indicators:
  - ALL CAPS words used for emphasis (e.g., "You WON'T BELIEVE")
  - Vague teasers that withhold information (e.g., "What happens next will shock you")
  - Exaggerated superlatives (e.g., "THE BEST EVER", "INSANE", "DESTROYED")
  - Emotional manipulation (e.g., "This made me cry")
  - Misleading curiosity gaps (e.g., "Doctors don't want you to know this")
  - Excessive punctuation (!!!, ???)

  Respond ONLY with a JSON array of objects: [{"title": "...", "clickbait": true/false}]
  No additional text, no markdown formatting.
  ```
- User message: `JSON.stringify(titles)`
- `max_tokens`: 1000, `temperature`: 0.1
- Parse the JSON response. Return only titles where `clickbait === false`.
- On JSON parse error: return all titles unfiltered (fail open).

**Done when:** Both functions can be called with mock data and return expected results when LM Studio is running.

---

## Task 3: YouTube Service

**Goal:** Create the service that searches YouTube.

**File:** `src/services/youtube.ts`

### `searchYouTube(query: string, apiKey: string): Promise<VideoResult[]>`

- GET `https://www.googleapis.com/youtube/v3/search`
- Query params:
  - `part=snippet`
  - `q={query}`
  - `type=video`
  - `maxResults=10`
  - `key={apiKey}`
- Map response to `VideoResult[]`:
  - `videoId` = `item.id.videoId`
  - `title` = `item.snippet.title` (decode HTML entities — YouTube returns `&amp;`, `&#39;`, etc.)
  - `thumbnailUrl` = `item.snippet.thumbnails.medium.url`
- On error: throw with a descriptive message.

**Done when:** Function returns an array of `VideoResult` objects when called with a valid API key and query.

---

## Task 4: Watch Time Service

**Goal:** Create the localStorage-based watch time tracker.

**File:** `src/services/watchTime.ts`

**Constants:**
- Storage key: `"aitube_watch_time"`
- Prune entries older than 7 days on every read.

**Implement these functions:**

### `getWatchTimeData(): WatchTimeData`
- Read from localStorage, parse JSON.
- If missing or corrupt, return `{ daily: {} }`.
- Prune keys older than 7 days.

### `addSeconds(seconds: number): void`
- Get today's date as `YYYY-MM-DD`.
- Add `seconds` to `daily[today]` (initialize to 0 if missing).
- Save back to localStorage.

### `getTodaySeconds(): number`
- Return `daily[today]` or 0.

### `getWeekSeconds(): number`
- Sum all values in `daily` (already pruned to 7 days).

### `formatTime(totalSeconds: number): string`
- Return string in format `Xh Ym` (e.g., `1h 23m`, `0h 5m`).

**Done when:** Functions correctly read/write localStorage. `addSeconds(65)` followed by `getTodaySeconds()` returns 65. `formatTime(3725)` returns `"1h 2m"`.

---

## Task 5: Config Service

**Goal:** Handle app configuration (API key + LM Studio URL) via localStorage.

**File:** `src/services/config.ts`

**Implement:**

### `getConfig(): AppConfig`
- Read from localStorage key `"aitube_config"`.
- Defaults: `lmStudioUrl = "http://localhost:1234"`, `youtubeApiKey = ""`.

### `saveConfig(config: AppConfig): void`
- Write to localStorage.

### `isConfigured(): boolean`
- Return `true` if `youtubeApiKey` is non-empty.

**Done when:** Config persists across page reloads.

---

## Task 6: Setup Screen Component

**Goal:** First-run screen where the user enters their YouTube API key.

**File:** `src/components/SetupScreen.tsx`

**Behavior:**
- Show heading: "Welcome to AI Tube"
- Text input for YouTube API key with label and placeholder.
- Optional text input for LM Studio URL (pre-filled with `http://localhost:1234`).
- "Save & Continue" button.
- Small helper text: "Get a free API key at console.cloud.google.com"
- On save: call `saveConfig()` and transition to search screen.
- Validate: API key field must be non-empty before allowing save.

**Styling:** Centered on screen, simple and clean, matching the minimal aesthetic.

**Done when:** Entering a key and clicking save stores the config and the parent can detect `isConfigured() === true`.

---

## Task 7: Watch Time Counter Component

**Goal:** Persistent counter displayed in the top-right corner of every screen.

**File:** `src/components/WatchTimeCounter.tsx`

**Props:**
```typescript
interface CounterProps {
  todayMins: number;
  weekMins: number;
}
```

(Parent passes values in minutes; component formats with `Xh Ym` helper.)

**Visual spec (pill badge):**
- Container: `bg-elev` bg, 1px `border` border, 999px border-radius, padding `6px 12px 6px 10px`
- Red dot: 6px circle, `var(--accent)`, `box-shadow: 0 0 0 3px var(--accent-soft)`
- "Today" / "Week" labels: `text-mute`, 11px, uppercase, monospace, letter-spacing 0.06em
- Values: `text`, weight 500, tabular-nums
- Separator `·`: `border-strong`

**Behavior:**
- Display: `● Today Xh Ym · Week Xh Ym`
- Parent refreshes values from watchTime service every 5 seconds.
- Shown in all post-setup screen topbars (not shown on SetupScreen).

**Done when:** Counter renders as a pill in the topbar, updates when watch time data changes in localStorage.

---

## Task 8: Search Screen Component

**Goal:** The home screen with logo and search input.

**File:** `src/components/SearchScreen.tsx`

**Props:**
- `onSearch(results: VideoResult[]): void` — called with filtered results when pipeline completes.

**Layout:**
- Everything vertically centered.
- Logo `xl` size (90×62 mark, 56px wordmark) centered, `margin-bottom: 44px`.
- Below it: a single text input (max-width 620px) with placeholder "What do you want to watch?" and search icon on the left, ⏎ kbd hint on the right.
- Search triggers on Enter key press (form submit) — no separate button.
- Monospace tagline below input: "AI rephrases your query · filters clickbait · max 3 results" (12px, `text-mute`).

**Thinking state (replaces search form while pipeline runs):**

Show three animated rows sequentially using `rowIn` keyframe animation:

| Row | Label | Content | Delay |
|-----|-------|---------|-------|
| 1 | YOU | original query | 0s |
| 2 | REPHRASE | typewriter rewrite (22ms/char) + blinking ▌ cursor | 0.45s |
| 3 | SEARCH | "Querying YouTube · filtering clickbait…" + spinner | 1.1s |

- Row 2 shows a spinner until typewriter completes, then a check icon.
- Row 1 shows a check icon immediately.
- Navigate to results at 2200ms total (regardless of typewriter state).

**Pipeline on submit:**
1. Call `rephraseQuery(userInput, config.lmStudioUrl)`.
2. Call `searchYouTube(rephrasedQuery, config.youtubeApiKey)`.
3. Extract titles from results.
4. Call `filterClickbait(titles, config.lmStudioUrl)`.
5. Filter the `VideoResult[]` to keep only non-clickbait titles.
6. Take the first 3 results.
7. Call `onSearch(filteredResults)`.

**Error handling:**
- If LM Studio is unreachable: show inline error "Cannot reach LM Studio. Make sure it's running."
- If YouTube fails: show inline error "YouTube search failed. Check your API key."
- If 0 results after filtering: show "No results found. Try a different search."

**Done when:** Typing a query and pressing Enter runs the full pipeline and calls `onSearch` with up to 3 `VideoResult` objects.

---

## Task 9: Result Card Component

**Goal:** A single search result row showing thumbnail and title.

**File:** `src/components/ResultCard.tsx`

**Props:**
- `video: VideoResult`
- `onClick(videoId: string): void`

**Props:**
- `video: VideoResult`
- `onClick(): void`
- `animationDelay?: string` (e.g. `"0.05s"` for staggered entrance)

**Layout:**
- Entire card is a `<button>` element (flex row, `bg-card`, 1px `border`, `var(--radius)` radius, padding 12px, gap 16px).
- Thumbnail: 168×94px, `radius-sm`, overflow hidden, relative positioning for duration badge.
  - Duration badge: absolute bottom-right, `rgba(0,0,0,0.85)` bg, white text 11px weight 500, padding `2px 5px`, radius 3px.
- Body: flex column, space-between.
  - Title: 14.5px, weight 500, 2-line `-webkit-line-clamp`, `var(--text)`.
  - Meta: 12px, channel in `text-dim`, views + posted in `text-mute`, separated by 3px dot.
- Hover: `bg-hover` bg, `border-strong` border.
- Focus-visible: accent border + accent-ring shadow.
- Entrance animation: `rowIn 0.4s ease forwards`, opacity starts at 0; apply `animationDelay` prop as `animation-delay`.

**Done when:** Component renders a clickable card with thumbnail, duration badge, title, and channel/views/posted meta.

---

## Task 10: Results List Component

**Goal:** Display up to 3 result cards with a back button.

**File:** `src/components/ResultsList.tsx`

**Props:**
- `results: VideoResult[]`
- `onSelect(videoId: string): void`
- `onBack(): void`

**Layout:**
- Topbar: back button (left) + `WatchTimeCounter` pill (right).
- Results header row: `Results for "<query>"` (left, 12px monospace) + `N picks · clickbait filtered` (right, 12px monospace `text-mute`).
- Vertical list of `ResultCard` components, max-width 640px, gap 12px.
- Pass staggered `animationDelay` to each card: `"0.05s"`, `"0.12s"`, `"0.19s"`.
- Empty state: EmptyBox icon tile + "Nothing clean to show" + body text + "Try another query" ghost button.
- Error state: Alert icon tile (accent colors) + "Couldn't reach YouTube" + body text + Back + Retry buttons.

**Done when:** Shows 1-3 result cards with staggered animation. Clicking a card calls `onSelect`. Back button calls `onBack`.

---

## Task 11: Player Screen Component

**Goal:** Embedded YouTube video player with watch time tracking.

**File:** `src/components/PlayerScreen.tsx`

**Props:**
- `videoId: string`
- `title: string`
- `onBack(): void`

**Behavior:**
- Topbar: back button (left) + `WatchTimeCounter` pill (right).
- Video container: max-width 760px, `aspect-ratio: 16/9`, black bg, `var(--radius)` radius, 1px `border`.
- Before playing: centered play button (68×48px pill, `rgba(0,0,0,0.7)` bg, accent on hover).
- While playing: controls bar overlaid at bottom of video (visible on hover/focus-within):
  - Pause button | elapsed time (monospace, 11px) | accent progress bar | total duration
  - `background: linear-gradient(180deg, transparent, rgba(0,0,0,.7))`
- Video title (20px, weight 600) and meta (channel · views · posted, 13px `text-dim`) below the container.
- Embedded YouTube player using an iframe: `https://www.youtube.com/embed/{videoId}?enablejsapi=1&autoplay=1`

**Watch time tracking:**
- Use the YouTube IFrame Player API (`YT.Player`) to listen for state changes.
- Load the IFrame API script (`https://www.youtube.com/iframe_api`) dynamically if not already loaded.
- On `PLAYING`: start a 1-second interval timer that calls `addSeconds(1)` each tick.
- On `PAUSED`, `BUFFERING`, `ENDED`, or component unmount: clear the interval.
- Clean up on unmount: destroy player instance, clear interval.

**Done when:** Video plays embedded in the app. Watch time counter in the corner ticks up while video is playing and stops when paused.

---

## Task 12: App Shell & Navigation

**Goal:** Wire all components together in `App.tsx` with simple state-based navigation.

**File:** `src/App.tsx`

**State:**
- `screen: AppScreen` — current screen ("setup" | "search" | "results" | "player")
- `results: VideoResult[]` — current search results
- `selectedVideo: VideoResult | null` — currently selected video

**Logic:**
- On mount: check `isConfigured()`. If false → show SetupScreen. If true → show SearchScreen.
- SetupScreen → on save → SearchScreen.
- SearchScreen → on search complete → ResultsList.
- ResultsList → on select → PlayerScreen.
- ResultsList → on back → SearchScreen (clear results).
- PlayerScreen → on back → ResultsList.

**Layout:**
- `WatchTimeCounter` rendered on all screens except SetupScreen.
- Minimal global styles: dark or light background, clean font (system font stack or Inter).

**Done when:** Full navigation flow works: setup → search → results → player → back to results → back to search.

---

## Task 13: Global Styling

**Goal:** Apply the minimal, clean visual design across the app.

**File:** `src/styles/global.css` (or Tailwind config if using Tailwind)

**Design tokens** (full set — define as CSS custom properties on `:root`):

```css
--bg: #0f0f0f;         --bg-elev: #171717;    --bg-card: #1a1a1a;   --bg-hover: #202020;
--border: #262626;     --border-strong: #333333;
--text: #e8e8e8;       --text-dim: #9a9a9a;   --text-mute: #6b6b6b;
--accent: #ff4444;     --accent-dim: #c53030;
--accent-soft: rgba(255,68,68,0.12);   --accent-ring: rgba(255,68,68,0.28);
--success: #4ade80;    --warn: #fbbf24;
--radius: 10px;        --radius-sm: 6px;      --radius-lg: 14px;
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
--font-mono: ui-monospace, "SF Mono", Menlo, Monaco, "Cascadia Mono", Consolas, monospace;
--ease: cubic-bezier(.2,.7,.2,1);
```

**Required keyframe animations:**

```css
@keyframes rowIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: none; }
}
@keyframes spin  { to { transform: rotate(360deg); } }
@keyframes blink { 50% { opacity: 0; } }
```

**Focus ring (global, no outline):**
```css
:focus-visible { outline: none; }
a:focus-visible, button:focus-visible {
  box-shadow: 0 0 0 3px var(--accent-ring);
  border-radius: 6px;
}
```

**Apply to:**
- Body/root background and text color.
- Input styling (padding, border, focus state).
- Card styling (hover effect, border radius, shadow).
- Button styling (accent background, white text, hover darken).
- Responsive: content max-width 700px, centered.

**Done when:** App looks cohesive and polished across all screens.

---

## Task 14: Error Boundary & Edge Cases

**Goal:** Handle all error and edge-case scenarios gracefully.

**Changes across files:**

1. **LM Studio timeout:** In `lmStudio.ts`, add a 15-second `AbortController` timeout to both fetch calls. On timeout, use fallback behavior (original query / unfiltered results).

2. **HTML entity decoding:** In `youtube.ts`, decode HTML entities in titles (`&amp;` → `&`, `&#39;` → `'`, `&quot;` → `"`, `&lt;`/`&gt;`). Use a small helper function, not a library.

3. **Empty input:** In `SearchScreen.tsx`, disable search if input is trimmed empty.

4. **localStorage quota:** In `watchTime.ts` and `config.ts`, wrap `localStorage.setItem` in try/catch. On failure, log a console warning but don't crash.

5. **Player cleanup:** In `PlayerScreen.tsx`, confirm that the YT player is destroyed and the interval is cleared on unmount — test by navigating away mid-video.

**Done when:** App handles each error scenario without crashing or showing a blank screen.

---

## Task 15: Build & Test

**Goal:** Verify the full pipeline works end-to-end and the app builds for Windows.

**Steps:**

1. **Manual test flow:**
   - Start LM Studio with Phi-4-mini or any small model.
   - Launch app with `npm run tauri dev`.
   - Enter YouTube API key on first run.
   - Search for "funny cat videos" — verify rephrased query is logged to console.
   - Verify 1-3 results appear, no obvious clickbait.
   - Click a result — verify video plays inline.
   - Watch for 30 seconds — verify counter updates.
   - Navigate back — verify counter persists.
   - Close and reopen app — verify counter and config persist.

2. **Build:**
   - Run `npm run tauri build`.
   - Verify `.msi` or `.exe` is produced in `src-tauri/target/release/bundle/`.
   - Install on a clean Windows machine (or test on same machine).
   - Run the installed app and repeat the manual test flow.

3. **Console check:** No uncaught errors, no React warnings in dev tools.

**Done when:** App completes the full flow without errors and builds into a working Windows executable.
