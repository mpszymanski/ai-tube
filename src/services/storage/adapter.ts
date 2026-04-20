export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export const KEYS = {
  CONFIG: "aitube_config",
  WATCH_TIME: "aitube_watch_time",
  SUBSCRIPTIONS: "aitube_subscriptions",
  API_QUOTA: "aitube_api_quota",
  SEEN_VIDEOS: "aitube_seen_videos",
} as const;
