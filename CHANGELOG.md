# Changelog

All notable changes to AI Tube are documented here.

## [v0.1.2] — 2026-05-01

### Fixes

- Polished the model download progress banner styling

---

## [v0.1.1] — 2026-05-01

### Fixes

- Clickbait classification is no longer run on channel feed results, which was unnecessary and wasted model inference time
- Improved progress feedback during model download and startup — status messages are now logged and surfaced in the banner
- Updated model status banner copy

---

## [v0.1.0] — 2026-04-29

### Features

- Local AI model (Qwen3) is bundled and auto-downloaded on first launch — no separate setup required
- YouTube video search with intent analysis: the AI interprets queries and routes them to video search, channel search, or channel browsing automatically
- Clickbait detection — videos are classified by the local model and can be hidden with a toggle
- Channel search and browsing with latest videos
- Subscriptions: subscribe to channels, browse them from the home screen
- Search query history (last 15 queries) with dropdown suggestions
- Watched videos tracking — previously seen videos are marked
- Daily and weekly watch time limits with a lock screen when exceeded
- YouTube API quota tracking to stay within the 10 000 units/day limit
- No Shorts — YouTube Shorts are excluded from all results
- Results always sorted newest-first
