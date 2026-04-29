# AI Tube

**Privacy-first YouTube for Windows. Local AI search, clickbait filtering, and watch time limits.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-0078D6.svg)](#installation)

YouTube's recommendation engine is engineered to maximise watch time — not yours, theirs. AI Tube replaces it with a deliberate search-driven interface: you decide what to watch, a local AI helps you find it, and enforced daily/weekly limits keep browsing in check. All AI processing runs on your machine; no queries or preferences are sent to any cloud.

---

## Features

- **Local AI search** — natural language queries are parsed by a local Qwen3-4B model. Phrases like *"Linus Tech Tips GPU reviews this month"* are understood as channel + topic + time period automatically.
- **Clickbait detection** — video titles are scored by the same local model. Flagged results are hidden by default; a toggle reveals them.
- **Watch time limits** — set daily and weekly caps. The app enforces them and prevents adjusting limits once you're over.
- **Channel subscriptions** — subscribe to channels and browse their latest videos outside of YouTube's feed.
- **Seen-video tracking** — watched videos are marked so you don't accidentally re-watch them.
- **Privacy-first** — the local model never phones home. Only the YouTube Data API (your key, your quota) touches the network.

---

## Screenshots

*Coming soon.*

---

## Installation

Download the latest **`AI-Tube_x.x.x_x64-setup.exe`** from the [Releases page](https://github.com/mpszymanski/ai-tube/releases/latest) and run the installer.

> **Windows SmartScreen warning**: because the build is unsigned, Windows may show "Windows protected your PC". Click **More info → Run anyway**. This is expected for open-source apps without a paid code-signing certificate.

On first launch the app downloads the Qwen3-4B-Instruct AI model (~3 GB) from Hugging Face. A progress bar is shown; this is a one-time download stored in your AppData folder.

---

## First-Time Setup

### 1. Get a YouTube Data API v3 key

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. Enable the **YouTube Data API v3** for that project.
3. Under **Credentials**, create an **API key**.
4. The free quota (10,000 units/day) is plenty for normal use.

### 2. Configure AI Tube

Enter your API key in the Setup screen on first launch. Optionally adjust your daily and weekly watch time limits (defaults: 60 min/day, 240 min/week).

---

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) (stable toolchain)
- Tauri CLI v2: `cargo install tauri-cli --version "^2"`
- Windows with MSVC build tools (Visual Studio Build Tools 2022 or the "Desktop development with C++" workload)

### Steps

```bash
git clone https://github.com/mpszymanski/ai-tube.git
cd ai-tube
npm install

# Download llama-server binary and DLLs into src-tauri/binaries/ (one-time, ~50 MB)
powershell -ExecutionPolicy Bypass -File scripts/fetch-llama-binaries.ps1

npm run tauri:dev
```

You will also need a YouTube Data API v3 key (see [First-Time Setup](#first-time-setup)).

### Running tests

```bash
npm run test:run   # single run
npm test           # watch mode
```

### Type checking

```bash
npx tsc --noEmit
```

### Building a release installer

```bash
npm run tauri:build
# Output: src-tauri/target/release/bundle/nsis/AI-Tube_x.x.x_x64-setup.exe
```

---

## Contributing

Pull requests are welcome. For non-trivial changes, open an issue first to discuss the approach.

**Code conventions:**

- Inline styles only — no CSS modules or Tailwind; design tokens via `var(--token)` from `src/styles/global.css`
- No external UI libraries — all components are bespoke
- TypeScript strict mode throughout
- Tests via [Vitest](https://vitest.dev/) + React Testing Library, placed alongside the files they test

See [CLAUDE.md](CLAUDE.md) for a full architecture overview and file map.

---

## License

[MIT](LICENSE) © 2025 Michał Szymański
