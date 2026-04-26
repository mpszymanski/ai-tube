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
  onQuotaUsed?: (units: number) => void,
): Promise<
  Map<
    string,
    {
      duration: string;
      viewCount: string;
      channelTitle: string;
      publishedAt: string;
    }
  >
> {
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "contentDetails,statistics,snippet");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return new Map();
  onQuotaUsed?.(1);

  const data = await res.json();
  const map = new Map<
    string,
    {
      duration: string;
      viewCount: string;
      channelTitle: string;
      publishedAt: string;
    }
  >();
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

async function fetchChannelThumbnails(
  channelIds: string[],
  apiKey: string,
  onQuotaUsed?: (units: number) => void,
): Promise<Map<string, string>> {
  if (channelIds.length === 0) return new Map();
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", channelIds.join(","));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return new Map();
  onQuotaUsed?.(1);

  const data = await res.json();
  const map = new Map<string, string>();
  for (const item of data.items ?? []) {
    const thumb = (
      item.snippet?.thumbnails?.default?.url ??
      item.snippet?.thumbnails?.medium?.url ??
      ""
    ).replace(/^\/\//, "https://");
    map.set(item.id, thumb);
  }
  return map;
}

async function searchVideoPage(
  params: Record<string, string>,
  apiKey: string,
  onQuotaUsed?: (units: number) => void,
): Promise<any[]> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("key", apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube API error: ${res.status} ${res.statusText}`);
  onQuotaUsed?.(100);

  return (await res.json()).items ?? [];
}

function mergeDedup(a: any[], b: any[]): any[] {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const item of [...a, ...b]) {
    const id = item.id?.videoId;
    if (id && !seen.has(id)) { seen.add(id); out.push(item); }
  }
  return out;
}

export async function searchChannels(
  name: string,
  apiKey: string,
  onQuotaUsed?: (units: number) => void,
): Promise<ChannelResult[]> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", name);
  url.searchParams.set("type", "channel");
  url.searchParams.set("maxResults", "5");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return [];
  onQuotaUsed?.(100);

  const data = await res.json();
  return (data.items ?? []).map(
    (item: any): ChannelResult => ({
      channelId: item.id.channelId,
      title: item.snippet.title,
      description: item.snippet.description ?? "",
      thumbnailUrl: (
        item.snippet.thumbnails?.medium?.url ??
        item.snippet.thumbnails?.default?.url ??
        item.snippet.thumbnails?.high?.url ??
        ""
      ).replace(/^\/\//, "https://"),
    }),
  );
}

export async function getChannelLatestVideos(
  channelId: string,
  apiKey: string,
  channelThumbnailUrl?: string,
  publishedAfter?: string,
  onQuotaUsed?: (units: number) => void,
): Promise<VideoResult[]> {
  const base: Record<string, string> = {
    channelId,
    order: "date",
    ...(publishedAfter ? { publishedAfter } : {}),
  };

  const [mediumItems, longItems] = await Promise.all([
    searchVideoPage({ ...base, videoDuration: "medium", maxResults: "8" }, apiKey, onQuotaUsed),
    searchVideoPage({ ...base, videoDuration: "long", maxResults: "2" }, apiKey, onQuotaUsed),
  ]);

  const items = mergeDedup(mediumItems, longItems);
  const videoIds = items.map((item) => item.id.videoId).filter(Boolean);
  const details =
    videoIds.length > 0 ? await fetchVideoDetails(videoIds, apiKey, onQuotaUsed) : new Map();

  return items
    .map((item: any): VideoResult => {
      const id = item.id.videoId;
      const d = details.get(id);
      return {
        videoId: id,
        title: decodeHtmlEntities(item.snippet.title),
        thumbnailUrl: item.snippet.thumbnails.medium.url,
        channelTitle: d?.channelTitle ?? item.snippet.channelTitle ?? "",
        channelId,
        channelThumbnailUrl: channelThumbnailUrl ?? "",
        publishedAt: d?.publishedAt ?? item.snippet.publishedAt ?? "",
        duration: d?.duration ?? "",
        viewCount: d?.viewCount ?? "",
      };
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function searchYouTube(
  query: string,
  apiKey: string,
  channelId?: string,
  publishedAfter?: string,
  onQuotaUsed?: (units: number) => void,
): Promise<VideoResult[]> {
  const base: Record<string, string> = {
    q: query,
    ...(channelId ? { channelId } : {}),
    ...(publishedAfter ? { publishedAfter } : {}),
  };

  const [mediumItems, longItems] = await Promise.all([
    searchVideoPage({ ...base, videoDuration: "medium", maxResults: "8" }, apiKey, onQuotaUsed),
    searchVideoPage({ ...base, videoDuration: "long", maxResults: "2" }, apiKey, onQuotaUsed),
  ]);

  const items = mergeDedup(mediumItems, longItems);
  const videoIds = items.map((item) => item.id.videoId).filter(Boolean);
  const details =
    videoIds.length > 0 ? await fetchVideoDetails(videoIds, apiKey, onQuotaUsed) : new Map();

  const uniqueChannelIds = [
    ...new Set(
      items
        .map((item: any) => item.snippet?.channelId)
        .filter(Boolean) as string[],
    ),
  ];
  const channelThumbs = await fetchChannelThumbnails(uniqueChannelIds, apiKey, onQuotaUsed);

  return items
    .map((item: any): VideoResult => {
      const id = item.id.videoId;
      const d = details.get(id);
      const itemChannelId: string = item.snippet?.channelId ?? "";
      return {
        videoId: id,
        title: decodeHtmlEntities(item.snippet.title),
        thumbnailUrl: item.snippet.thumbnails.medium.url,
        channelTitle: d?.channelTitle ?? item.snippet.channelTitle ?? "",
        channelId: itemChannelId || undefined,
        channelThumbnailUrl: itemChannelId
          ? (channelThumbs.get(itemChannelId) ?? "")
          : "",
        publishedAt: d?.publishedAt ?? item.snippet.publishedAt ?? "",
        duration: d?.duration ?? "",
        viewCount: d?.viewCount ?? "",
      };
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
