# AI Tube — Design System Reference

Derived from the Claude Design prototype (`AI Tube.html`). Use this file during implementation instead of re-reading the raw HTML. Match visual output pixel-for-pixel.

---

## Color tokens

```css
:root {
  --bg:            #0f0f0f;
  --bg-elev:       #171717;
  --bg-card:       #1a1a1a;
  --bg-hover:      #202020;
  --border:        #262626;
  --border-strong: #333333;
  --text:          #e8e8e8;
  --text-dim:      #9a9a9a;
  --text-mute:     #6b6b6b;
  --accent:        #ff4444;
  --accent-dim:    #c53030;
  --accent-soft:   rgba(255, 68, 68, 0.12);
  --accent-ring:   rgba(255, 68, 68, 0.28);
  --success:       #4ade80;
  --warn:          #fbbf24;

  --radius:    10px;
  --radius-sm:  6px;
  --radius-lg: 14px;

  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, Monaco, "Cascadia Mono", Consolas, monospace;

  --ease: cubic-bezier(.2,.7,.2,1);
}
```

---

## Typography

- Body: 15px, `var(--font-sans)`, `var(--text)`, line-height 1.5, antialiased
- Monospace used for: API keys/URLs, query rephrase label, timestamps, counter values, keyboard hints
- No emojis anywhere in the UI

---

## Logo component

Original mark — **not** a recreation of any existing brand.

**Structure:**
```
[red rounded-rect mark with white SVG play triangle] [AI][Tube]
```

- Mark: `var(--accent)` background, inline SVG `<path d="M3.5 2v10l8-5-8-5z" fill="#fff" />`
- Wordmark: `"AI"` in `var(--text)` weight 600, `"Tube"` in `var(--text-dim)` weight 500
- Gap between mark and wordmark: 10px

**Sizes:**

| Size | Mark (w×h) | Mark radius | Font size | Letter spacing |
|------|-----------|-------------|-----------|----------------|
| `sm` | 28×20     | 5px         | 15px      | -0.01em        |
| `lg` | 72×50     | 12px        | 44px      | -0.03em        |
| `xl` | 90×62     | 14px        | 56px      | -0.035em       |

Play glyph SVG size scales with mark: `sm`=10px, `lg`=22px, `xl`=28px.

---

## App chrome

```css
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app__topbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  padding: 18px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
}

.app__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 96px 24px 64px;
}
```

---

## Watch counter pill

Shown in the topbar of all screens **except** SetupScreen (where the Logo takes that position instead).

```
● Today  0h 23m · Week  2h 22m
```

- Container: `bg-elev` bg, 1px `border` border, 999px radius, `padding: 6px 12px 6px 10px`
- Red dot: 6px circle, `var(--accent)` fill, `box-shadow: 0 0 0 3px var(--accent-soft)`
- Labels ("Today", "Week"): `text-mute`, 11px, uppercase, letter-spacing 0.06em, `font-mono`
- Values: `text`, 15px weight 500, tabular-nums
- Separator dot `·`: `border-strong`
- Update interval: every 5 seconds from localStorage

**Props interface:**
```typescript
interface CounterProps {
  todayMins: number;
  weekMins: number;
}
```

Format helper: `Xh Ym` (e.g., `1h 23m`, `0h 5m`).

---

## Back button

Used in topbar (left side) on Results and Player screens.

```
← Back
```

- Transparent bg, `text-dim` color, 13px, `padding: 8px 12px 8px 8px`
- Arrow: inline SVG, not a unicode arrow
- Hover: `text` color, `bg-elev` background
- Transition: 0.15s

---

## Setup screen

Centered card, max-width 420px.

```
card (bg-card, radius-lg, border, padding 32px)
  [key icon 52×52, radius 14, bg-elev, border]
  "Welcome to AI Tube"  (22px, weight 600, -0.02em)
  "Two things and we're done."  (text-dim, 13px)
  ---
  [label] YouTube API Key
  [input --mono]  placeholder "AIzaSy…"
  hint: Get a free key at console.cloud.google.com
  ---
  [label] LM Studio URL
  [input --mono]  default "http://localhost:1234"
  hint: Your local model endpoint — used to rephrase queries.
  ---
  [btn] Save & Continue  (disabled until key ≥ 20 chars)
```

- Input validation: key field error state if blurred + non-empty + length < 20
- Error state: `var(--accent)` border + `var(--accent-ring)` box-shadow

---

## Search screen

Centered vertically in `app__main`.

```
[Logo xl]  (margin-bottom: 44px)

[search input, max-width 620px]
  left: search icon (18px SVG)
  right: ⏎ kbd hint (monospace, fades on blur)

[tagline below, text-mute, 12px, font-mono]
"AI rephrases your query · filters clickbait · max 3 results"
```

**Search input:**
- bg-elev, radius 12px, padding `18px 52px 18px 50px`, 16px font
- Focus: accent border, accent-ring shadow, bg-card bg
- On focus-within: search icon turns `var(--accent)`

---

## Thinking state (search → results transition)

Replaces the search UI while the pipeline is running. Three animated rows appear sequentially.

```
[row 1]  YOU      <original query>           ✓
[row 2]  REPHRASE <typewriter rewrite>▌       ✓ or ⟳
[row 3]  SEARCH   Querying YouTube · filtering clickbait…  ⟳
```

**Row structure:** `bg-elev`, 1px `border`, `radius` 10px, `padding: 14px 18px`, gap 12px
- Label: `text-mute`, 11px, monospace uppercase, letter-spacing 0.08em, min-width 78px
- Value: `text`, flex: 1
- Trailing icon: check SVG (`success` color) or spinner

**Animation:**

```css
@keyframes rowIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: none; }
}
```

Row delays: row 1 = 0s, row 2 = 0.45s, row 3 = 1.1s. Duration: 0.5s.

**Typewriter:** type rewritten query at 22ms per character using `setInterval`.
- Blinking cursor `▌` rendered as `::after` with `animation: blink 1s steps(2) infinite`
- Check icon appears when full rewrite is rendered; spinner while typing

**Navigation:** fires at 2200ms total from search submit (regardless of typewriter progress).

---

## Results screen

Max-width 640px.

**Header row (results meta):**
- Left: `Results for "<query>"` — query in `text`, rest in `text-dim`, 12px monospace
- Right: `N picks · clickbait filtered` — `text-mute`, 12px monospace

**Result card:**

```
[card: bg-card, border, radius, flex row, padding 12px, gap 16px]
  [thumbnail 168×94, radius-sm, overflow hidden]
    [duration badge: absolute bottom-right, rgba(0,0,0,0.85), white, 11px, padding 2px 5px, radius 3px]
  [body: flex-col, space-between]
    [title: 14.5px, weight 500, 2-line clamp]
    [meta: 12px]
      [channel: text-dim]  ·  [views: text-mute]  ·  [posted: text-mute]
```

- Entire card is a `<button>` element
- Hover: `bg-hover`, `border-strong` border
- Focus-visible: accent border + accent-ring shadow

**Staggered entrance animation:**

```css
.result { animation: rowIn .4s var(--ease) forwards; opacity: 0; }
.result:nth-child(1) { animation-delay: .05s; }
.result:nth-child(2) { animation-delay: .12s; }
.result:nth-child(3) { animation-delay: .19s; }
```

---

## Empty state

```
[icon tile 48×48, bg-elev, border, radius 12]
  [EmptyBox icon 22px, text-dim]
"Nothing clean to show"  (17px, weight 500)
[body text, text-dim, 13.5px]
[Try another query] button (ghost style)
```

---

## Error state

Same layout as empty, but icon tile uses accent colors:

```css
.state__icon--error {
  color: var(--accent);
  background: var(--accent-soft);
  border-color: var(--accent-ring);
}
```

Buttons: ghost "Back" + filled "Retry".

---

## Player screen

Max-width 760px.

**Video container:**
- `aspect-ratio: 16 / 9`, black bg, `var(--radius)` radius, 1px `border`
- Contains thumbnail placeholder (real impl: YouTube IFrame)

**Play button (before playing):**
- 68×48px pill, centered absolute, `rgba(0,0,0,0.7)` bg, 1px `rgba(255,255,255,0.15)` border, radius 12px
- Icon: PlayBig SVG (28px), white, margin-left 3px
- Hover: bg → `var(--accent)`, scale 1.05

**Controls bar (while playing):**
- Absolute bottom of video container, `padding: 14px 16px 12px`
- `background: linear-gradient(180deg, transparent, rgba(0,0,0,.7))`
- Opacity 0 by default; 1 on `.player__video:hover` or `:focus-within`
- Contents: pause button | elapsed time | progress bar | total duration

**Progress bar:**
- Height 3px, `rgba(255,255,255,.2)` track, `var(--accent)` fill, radius 2px

**Time display:** monospace 11px, white, tabular-nums (`Xm:Ss` format)

**Title below video:** 20px, weight 600, -0.015em letter-spacing
**Meta below title:** 13px, `text-dim`, channel · views · posted

---

## Animations

```css
@keyframes rowIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: none; }
}
@keyframes spin  { to { transform: rotate(360deg); } }
@keyframes blink { 50% { opacity: 0; } }
```

Spinner: 14×14px, 2px border, `border-strong` base, `accent` top, 0.7s linear.

---

## Interaction rules

- Focus ring: `box-shadow: 0 0 0 3px var(--accent-ring)` — no outline
- All hover transitions: 0.15s `var(--ease)` (0.2s for search input)
- Buttons use `transform: scale(.995)` on active
- Disabled button: `border-strong` bg, `text-mute` text, `not-allowed` cursor

---

## Icons (all inline SVG, no emoji, no icon font)

| Name      | Viewbox | Description                        |
|-----------|---------|------------------------------------|
| Play      | 14×14   | Filled triangle (small, for cards) |
| PlayBig   | 28×28   | Filled triangle (player button)    |
| Search    | 20×20   | Circle + line, stroke 1.8          |
| Arrow     | 14×14   | Left arrow (back button)           |
| Check     | 14×14   | Checkmark stroke                   |
| Alert     | 20×20   | Circle with exclamation            |
| EmptyBox  | 20×20   | Open box / package outline         |
| Key       | 28×28   | Key outline (setup screen header)  |
