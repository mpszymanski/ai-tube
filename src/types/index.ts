export interface VideoResult {
  videoId: string;
  title: string;
  thumbnailUrl: string;
}

export interface WatchTimeData {
  daily: Record<string, number>;
}

export interface AppConfig {
  lmStudioUrl: string;
  youtubeApiKey: string;
}

export type AppScreen = "setup" | "search" | "results" | "player";
