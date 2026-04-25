import { VideoResult, ChannelResult, ChannelResultWithVideos } from "../types";
import { searchYouTube, getChannelLatestVideos } from "./youtube";
import { classifyClickbait } from "./lmStudio";
import { recordUnits } from "./apiUsage";

interface VideoSearchParams {
  query: string;
  channelId?: string;
  publishedAfter?: string;
  apiKey: string;
}

interface ChannelSearchParams {
  channel: ChannelResult;
  publishedAfter?: string;
  apiKey: string;
}

export async function runVideoSearch(params: VideoSearchParams): Promise<VideoResult[]> {
  const { query, channelId, publishedAfter, apiKey } = params;
  const allResults = await searchYouTube(query, apiKey, channelId, publishedAfter, recordUnits);
  const titles = allResults.map((r) => r.title);
  const classified = await classifyClickbait(titles);
  const clickbaitMap = new Map(classified.map((item) => [item.title, item.clickbait]));
  return allResults
    .map((r) => ({ ...r, isClickbait: clickbaitMap.get(r.title) ?? false }))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 10);
}

export async function runChannelSearch(params: ChannelSearchParams): Promise<ChannelResultWithVideos> {
  const { channel, publishedAfter, apiKey } = params;
  const allResults = await getChannelLatestVideos(
    channel.channelId,
    apiKey,
    channel.thumbnailUrl,
    publishedAfter,
    recordUnits,
  );
  const titles = allResults.map((r) => r.title);
  const classified = await classifyClickbait(titles);
  const clickbaitMap = new Map(classified.map((item) => [item.title, item.clickbait]));
  const latestVideos = allResults
    .map((r) => ({ ...r, isClickbait: clickbaitMap.get(r.title) ?? false }))
    .slice(0, 10);
  return { channel, latestVideos };
}
