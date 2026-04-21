import type { AppConfig } from "../types";
import type { StorageAdapter } from "./storage/adapter";
import { KEYS } from "./storage/adapter";
import { getAdapter } from "./storage";

const defaults: AppConfig = {
  youtubeApiKey: "",
  dailyLimitSeconds: 3600,
  weeklyLimitSeconds: 14400,
};

let cache: AppConfig | null = null;

export async function hydrate(adapter?: StorageAdapter): Promise<void> {
  const a = adapter ?? getAdapter();
  try {
    const raw = await a.get(KEYS.CONFIG);
    cache = raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    cache = { ...defaults };
  }
}

export function getConfig(): AppConfig {
  return cache ?? { ...defaults };
}

export function saveConfig(config: AppConfig): void {
  cache = config;
  getAdapter()
    .set(KEYS.CONFIG, JSON.stringify(config))
    .catch(() => console.warn("aitube: config not saved"));
}

export function isConfigured(): boolean {
  return getConfig().youtubeApiKey.length > 0;
}

export function _reset(): void {
  cache = null;
}
