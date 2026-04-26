import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { searchYouTube, getChannelLatestVideos, searchChannels } from "./youtube";

function makeSearchItem(videoId: string, channelId = "ch1", publishedAt = "2026-01-01T00:00:00Z") {
  return {
    id: { videoId },
    snippet: {
      title: `Title ${videoId}`,
      channelId,
      channelTitle: `Channel ${channelId}`,
      publishedAt,
      thumbnails: { medium: { url: `https://thumb/${videoId}` } },
    },
  };
}

function makeDetailsItem(videoId: string, duration: string, publishedAt = "2026-01-01T00:00:00Z") {
  return {
    id: videoId,
    contentDetails: { duration },
    statistics: { viewCount: "1000" },
    snippet: { channelTitle: "Channel ch1", publishedAt },
  };
}

function makeChannelItem(channelId: string, title: string) {
  return {
    id: { channelId },
    snippet: {
      title,
      description: "desc",
      thumbnails: { medium: { url: `https://thumb/${channelId}` } },
    },
  };
}

function mockFetch(responses: Record<string, any>) {
  return vi.fn((url: string) => {
    for (const [key, body] of Object.entries(responses)) {
      if (url.includes(key)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
      }
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) });
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch({}));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchYouTube", () => {
  it("makes two search calls — medium and long", async () => {
    const fetcher = vi.fn((url: string) => {
      if (url.includes("googleapis.com/youtube/v3/search")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) });
    });
    vi.stubGlobal("fetch", fetcher);

    await searchYouTube("cats", "KEY");

    const searchCalls = fetcher.mock.calls
      .map(([url]: [string]) => url)
      .filter((url: string) => url.includes("/search"));

    expect(searchCalls.length).toBe(2);
    expect(searchCalls.some((u: string) => u.includes("videoDuration=medium"))).toBe(true);
    expect(searchCalls.some((u: string) => u.includes("videoDuration=long"))).toBe(true);
    expect(searchCalls.some((u: string) => u.includes("maxResults=8"))).toBe(true);
    expect(searchCalls.some((u: string) => u.includes("maxResults=2"))).toBe(true);
  });

  it("merges medium and long results", async () => {
    const mediumItem = makeSearchItem("v1", "ch1", "2026-03-01T00:00:00Z");
    const longItem = makeSearchItem("v2", "ch1", "2026-04-01T00:00:00Z");

    const fetcher = vi.fn((url: string) => {
      if (url.includes("/search") && url.includes("videoDuration=medium")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [mediumItem] }) });
      }
      if (url.includes("/search") && url.includes("videoDuration=long")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [longItem] }) });
      }
      if (url.includes("/videos")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            items: [
              makeDetailsItem("v1", "PT8M", "2026-03-01T00:00:00Z"),
              makeDetailsItem("v2", "PT25M", "2026-04-01T00:00:00Z"),
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) });
    });
    vi.stubGlobal("fetch", fetcher);

    const results = await searchYouTube("cats", "KEY");
    expect(results.map((r) => r.videoId)).toEqual(["v2", "v1"]);
  });

  it("deduplicates videos appearing in both medium and long results", async () => {
    const item = makeSearchItem("v1", "ch1", "2026-01-01T00:00:00Z");

    const fetcher = vi.fn((url: string) => {
      if (url.includes("/search")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [item] }) });
      }
      if (url.includes("/videos")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [makeDetailsItem("v1", "PT10M")] }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) });
    });
    vi.stubGlobal("fetch", fetcher);

    const results = await searchYouTube("cats", "KEY");
    expect(results.filter((r) => r.videoId === "v1").length).toBe(1);
  });

  it("sorts results newest-first by publishedAt", async () => {
    const items = [
      makeSearchItem("old", "ch1", "2026-01-01T00:00:00Z"),
      makeSearchItem("new", "ch1", "2026-04-01T00:00:00Z"),
      makeSearchItem("mid", "ch1", "2026-02-01T00:00:00Z"),
    ];

    const fetcher = vi.fn((url: string) => {
      if (url.includes("/search") && url.includes("videoDuration=medium")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ items }) });
      }
      if (url.includes("/search")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) });
      }
      if (url.includes("/videos")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            items: [
              makeDetailsItem("old", "PT8M", "2026-01-01T00:00:00Z"),
              makeDetailsItem("new", "PT8M", "2026-04-01T00:00:00Z"),
              makeDetailsItem("mid", "PT8M", "2026-02-01T00:00:00Z"),
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) });
    });
    vi.stubGlobal("fetch", fetcher);

    const results = await searchYouTube("cats", "KEY");
    expect(results.map((r) => r.videoId)).toEqual(["new", "mid", "old"]);
  });

  it("tracks quota for both search calls", async () => {
    const item = makeSearchItem("v1");
    const fetcher = vi.fn((url: string) => {
      if (url.includes("/search")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [item] }) });
      }
      if (url.includes("/videos")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [makeDetailsItem("v1", "PT8M")] }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) });
    });
    vi.stubGlobal("fetch", fetcher);

    let quota = 0;
    await searchYouTube("cats", "KEY", undefined, undefined, (u) => { quota += u; });
    expect(quota).toBeGreaterThanOrEqual(200);
  });

  it("returns empty array when both search calls fail", async () => {
    const fetcher = vi.fn((url: string) => {
      if (url.includes("/search")) {
        return Promise.resolve({ ok: false, status: 403, statusText: "Forbidden" });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) });
    });
    vi.stubGlobal("fetch", fetcher);

    await expect(searchYouTube("cats", "KEY")).rejects.toThrow("YouTube API error");
  });
});

describe("getChannelLatestVideos", () => {
  it("makes two search calls with channelId, order=date, medium and long", async () => {
    const fetcher = vi.fn((url: string) => {
      if (url.includes("/search")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) });
    });
    vi.stubGlobal("fetch", fetcher);

    await getChannelLatestVideos("ch1", "KEY");

    const searchCalls = fetcher.mock.calls
      .map(([url]: [string]) => url)
      .filter((url: string) => url.includes("/search"));

    expect(searchCalls.length).toBe(2);
    expect(searchCalls.every((u: string) => u.includes("channelId=ch1"))).toBe(true);
    expect(searchCalls.every((u: string) => u.includes("order=date"))).toBe(true);
    expect(searchCalls.some((u: string) => u.includes("videoDuration=medium"))).toBe(true);
    expect(searchCalls.some((u: string) => u.includes("videoDuration=long"))).toBe(true);
  });

  it("sorts results newest-first by publishedAt", async () => {
    const olderItem = makeSearchItem("v-old", "ch1", "2026-01-01T00:00:00Z");
    const newerItem = makeSearchItem("v-new", "ch1", "2026-04-01T00:00:00Z");

    const fetcher = vi.fn((url: string) => {
      if (url.includes("/search") && url.includes("videoDuration=medium")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [olderItem] }) });
      }
      if (url.includes("/search") && url.includes("videoDuration=long")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [newerItem] }) });
      }
      if (url.includes("/videos")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            items: [
              makeDetailsItem("v-old", "PT8M", "2026-01-01T00:00:00Z"),
              makeDetailsItem("v-new", "PT25M", "2026-04-01T00:00:00Z"),
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) });
    });
    vi.stubGlobal("fetch", fetcher);

    const results = await getChannelLatestVideos("ch1", "KEY");
    expect(results[0].videoId).toBe("v-new");
    expect(results[1].videoId).toBe("v-old");
  });

  it("passes publishedAfter when provided", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) }),
    );
    vi.stubGlobal("fetch", fetcher);

    await getChannelLatestVideos("ch1", "KEY", undefined, "2026-01-01T00:00:00Z");

    const searchCalls = fetcher.mock.calls
      .map(([url]: [string]) => url)
      .filter((url: string) => url.includes("/search"));

    expect(searchCalls.every((u: string) => u.includes("publishedAfter="))).toBe(true);
  });
});

describe("searchChannels", () => {
  it("returns mapped channel results", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items: [makeChannelItem("ch1", "Test Channel")] }),
      }),
    );
    vi.stubGlobal("fetch", fetcher);

    const results = await searchChannels("Test", "KEY");
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ channelId: "ch1", title: "Test Channel" });
  });

  it("returns empty array on API error", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: false })));
    const results = await searchChannels("Test", "KEY");
    expect(results).toEqual([]);
  });

  it("tracks 100 quota units", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) })),
    );
    let quota = 0;
    await searchChannels("Test", "KEY", (u) => { quota += u; });
    expect(quota).toBe(100);
  });
});
