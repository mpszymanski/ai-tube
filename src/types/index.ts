export interface VideoResult {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
}

export interface WatchTimeData {
  daily: Record<string, number>;
}

export interface AppConfig {
  lmStudioUrl: string;
  youtubeApiKey: string;
}

export type AppScreen = "setup" | "search" | "results" | "player";

export interface ChannelResult {
  channelId: string;
  title: string;
  thumbnailUrl: string;
  description: string;
}
