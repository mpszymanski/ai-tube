import { VideoResult, ChannelResult } from "../types";

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function fetchVideoDetails(
  videoIds: string[],
  apiKey: string,
): Promise<Map<string, { duration: string; viewCount: string; channelTitle: string; publishedAt: string }>> {
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "contentDetails,statistics,snippet");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return new Map();

  const data = await res.json();
  const map = new Map<string, { duration: string; viewCount: string; channelTitle: string; publishedAt: string }>();
  for (const item of data.items ?? []) {
    map.set(item.id, {
      duration: item.contentDetails?.duration ?? "",
      viewCount: item.statistics?.viewCount ?? "",
      channelTitle: item.snippet?.channelTitle ?? "",
      publishedAt: item.snippet?.publishedAt ?? "",
    });
  }
  return map;
}

export async function searchChannels(name: string, apiKey: string): Promise<ChannelResult[]> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", name);
  url.searchParams.set("type", "channel");
  url.searchParams.set("maxResults", "5");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = await res.json();
  return (data.items ?? []).map((item: any): ChannelResult => ({
    channelId: item.id.channelId,
    title: item.snippet.title,
    description: item.snippet.description ?? "",
    thumbnailUrl: (
      item.snippet.thumbnails?.medium?.url ??
      item.snippet.thumbnails?.default?.url ??
      item.snippet.thumbnails?.high?.url ??
      ""
    ).replace(/^\/\//, "https://"),
  }));
}

export async function searchYouTube(query: string, apiKey: string, channelId?: string): Promise<VideoResult[]> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "10");
  if (channelId) url.searchParams.set("channelId", channelId);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`YouTube API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const items: any[] = data.items ?? [];
  const videoIds = items.map((item) => item.id.videoId).filter(Boolean);

  const details = videoIds.length > 0 ? await fetchVideoDetails(videoIds, apiKey) : new Map();

  return items.map((item: any): VideoResult => {
    const id = item.id.videoId;
    const d = details.get(id);
    return {
      videoId: id,
      title: decodeHtmlEntities(item.snippet.title),
      thumbnailUrl: item.snippet.thumbnails.medium.url,
      channelTitle: d?.channelTitle ?? item.snippet.channelTitle ?? "",
      publishedAt: d?.publishedAt ?? item.snippet.publishedAt ?? "",
      duration: d?.duration ?? "",
      viewCount: d?.viewCount ?? "",
    };
  });
}
