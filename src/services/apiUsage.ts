import type { StorageAdapter } from "./storage/adapter";
import { KEYS } from "./storage/adapter";
import { getAdapter } from "./storage";

const MAX_UNITS = 10000;

interface UsageData {
  date: string;
  units: number;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

let cache: UsageData | null = null;

export async function hydrate(adapter?: StorageAdapter): Promise<void> {
  const a = adapter ?? getAdapter();
  try {
    const raw = await a.get(KEYS.API_QUOTA);
    if (raw) {
      const data = JSON.parse(raw) as UsageData;
      cache = data.date === today() ? data : { date: today(), units: 0 };
    } else {
      cache = { date: today(), units: 0 };
    }
  } catch {
    cache = { date: today(), units: 0 };
  }
}

function readUsage(): UsageData {
  if (!cache || cache.date !== today()) {
    return { date: today(), units: 0 };
  }
  return cache;
}

export function recordUnits(units: number): void {
  const data = readUsage();
  data.units += units;
  cache = data;
  getAdapter()
    .set(KEYS.API_QUOTA, JSON.stringify(data))
    .catch(() => console.warn("aitube: API usage not saved"));
}

export function getUsage(): { used: number; max: number } {
  return { used: readUsage().units, max: MAX_UNITS };
}

export function _reset(): void {
  cache = null;
}
