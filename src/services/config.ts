import { AppConfig } from "../types";

const STORAGE_KEY = "aitube_config";

const defaults: AppConfig = {
  lmStudioUrl: "http://localhost:1234",
  youtubeApiKey: "",
};

export function getConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
  }
}

export function saveConfig(config: AppConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    console.warn("aitube: localStorage quota exceeded, config not saved");
  }
}

export function isConfigured(): boolean {
  return getConfig().youtubeApiKey.length > 0;
}
