import { VideoResult } from "../types";

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export async function searchYouTube(query: string, apiKey: string): Promise<VideoResult[]> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "10");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`YouTube API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return (data.items ?? []).map((item: any): VideoResult => ({
    videoId: item.id.videoId,
    title: decodeHtmlEntities(item.snippet.title),
    thumbnailUrl: item.snippet.thumbnails.medium.url,
  }));
}
