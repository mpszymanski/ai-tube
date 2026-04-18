import { WatchTimeData } from "../types";

const STORAGE_KEY = "aitube_watch_time";

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

export function getWatchTimeData(): WatchTimeData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { daily: {} };
    const parsed: WatchTimeData = JSON.parse(raw);
    return pruneOldDays(parsed);
  } catch {
    return { daily: {} };
  }
}

export function addSeconds(seconds: number): void {
  const data = getWatchTimeData();
  const today = todayKey();
  data.daily[today] = (data.daily[today] ?? 0) + seconds;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.warn("aitube: localStorage quota exceeded, watch time not saved");
  }
}

export function getTodaySeconds(): number {
  const data = getWatchTimeData();
  return data.daily[todayKey()] ?? 0;
}

export function getWeekSeconds(): number {
  const data = getWatchTimeData();
  return Object.values(data.daily).reduce((sum, v) => sum + v, 0);
}

export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
}
