import type { StorageAdapter } from "./storage/adapter";
import { KEYS } from "./storage/adapter";
import { getAdapter } from "./storage";

const MAX = 15;

let cache: string[] | null = null;

export async function hydrate(adapter?: StorageAdapter): Promise<void> {
  const a = adapter ?? getAdapter();
  try {
    const raw = await a.get(KEYS.SEARCH_HISTORY);
    cache = raw ? JSON.parse(raw) : [];
  } catch {
    cache = [];
  }
}

export function getHistory(): string[] {
  return cache ?? [];
}

export function addToHistory(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  const next = (cache ?? []).filter((q) => q !== trimmed);
  next.unshift(trimmed);
  cache = next.slice(0, MAX);
  getAdapter()
    .set(KEYS.SEARCH_HISTORY, JSON.stringify(cache))
    .catch(() => console.warn("aitube: search history not saved"));
}
