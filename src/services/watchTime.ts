import type { WatchTimeData } from "../types";
import type { StorageAdapter } from "./storage/adapter";
import { KEYS } from "./storage/adapter";
import { getAdapter } from "./storage";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function pruneOldDays(data: WatchTimeData): WatchTimeData {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const daily: Record<string, number> = {};
  for (const [key, val] of Object.entries(data.daily)) {
    if (key >= cutoffStr) daily[key] = val;
  }
  return { daily };
}

let cache: WatchTimeData | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    if (cache) {
      getAdapter()
        .set(KEYS.WATCH_TIME, JSON.stringify(cache))
        .catch(() => console.warn("aitube: watch time not saved"));
    }
  }, 5000);
}

export async function hydrate(adapter?: StorageAdapter): Promise<void> {
  const a = adapter ?? getAdapter();
  try {
    const raw = await a.get(KEYS.WATCH_TIME);
    const parsed: WatchTimeData = raw ? JSON.parse(raw) : { daily: {} };
    cache = pruneOldDays(parsed);
  } catch {
    cache = { daily: {} };
  }
}

export function getWatchTimeData(): WatchTimeData {
  return cache ? pruneOldDays(cache) : { daily: {} };
}

export function addSeconds(seconds: number): void {
  const data = getWatchTimeData();
  const today = todayKey();
  data.daily[today] = (data.daily[today] ?? 0) + seconds;
  cache = data;
  scheduleFlush();
}

export function getTodaySeconds(): number {
  return getWatchTimeData().daily[todayKey()] ?? 0;
}

function currentWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon … 6=Sat
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  return monday.toISOString().slice(0, 10);
}

export function getWeekSeconds(): number {
  const weekStart = currentWeekStart();
  return Object.entries(getWatchTimeData().daily)
    .filter(([key]) => key >= weekStart)
    .reduce((sum, [, v]) => sum + v, 0);
}

export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function _reset(): void {
  cache = null;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}
