export interface VideoResult {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  channelId?: string;
  channelThumbnailUrl?: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  isClickbait?: boolean;
}

export interface WatchTimeData {
  daily: Record<string, number>;
}

export interface AppConfig {
  youtubeApiKey: string;
  dailyLimitSeconds: number;
  weeklyLimitSeconds: number;
}

export type AppScreen = "setup" | "search" | "results" | "channel-results" | "player" | "subscriptions";

export type ResultsScreenState = { kind: "results"; results: VideoResult[]; query: string };
export type ChannelResultsScreenState = { kind: "channel-results"; data: ChannelResultWithVideos; query: string };

export type ScreenState =
  | { kind: "setup" }
  | { kind: "search" }
  | { kind: "subscriptions" }
  | ResultsScreenState
  | ChannelResultsScreenState
  | { kind: "player"; video: VideoResult; prevState: ResultsScreenState | ChannelResultsScreenState };

export type SearchIntent = "videos" | "channel" | "channel-videos";

export type TimePeriod = "today" | "this_week" | "this_month" | "this_year";

export interface ChannelResult {
  channelId: string;
  title: string;
  thumbnailUrl: string;
  description: string;
}

export interface ChannelResultWithVideos {
  channel: ChannelResult;
  latestVideos: VideoResult[];
}

export const MODEL_STATUS = {
  CHECKING: "checking",
  DOWNLOADING: "downloading",
  STARTING: "starting",
  READY: "ready",
  ERROR: "error",
} as const;

export type ModelStatus = (typeof MODEL_STATUS)[keyof typeof MODEL_STATUS];

