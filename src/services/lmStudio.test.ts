import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeQuery, classifyClickbait } from "./lmStudio";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockLmResponse(body: unknown) {
  mockFetch.mockResolvedValueOnce({
    json: () => Promise.resolve({
      choices: [{ message: { content: JSON.stringify(body) } }],
    }),
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("analyzeQuery", () => {
  it("returns parsed result for valid response", async () => {
    mockLmResponse({ videoQuery: "rust programming tutorial", intent: "videos" });
    const result = await analyzeQuery("latest rust tutorials", "http://localhost:1234");
    expect(result).toEqual({ videoQuery: "rust programming tutorial", intent: "videos", channelName: undefined });
  });

  it("includes channelName when present", async () => {
    mockLmResponse({ videoQuery: "Fireship", intent: "channel", channelName: "Fireship" });
    const result = await analyzeQuery("show me fireship channel", "http://localhost:1234");
    expect(result.intent).toBe("channel");
    expect(result.channelName).toBe("Fireship");
  });

  it("falls back to 'videos' intent for unknown intent string", async () => {
    mockLmResponse({ videoQuery: "cats", intent: "unknown-intent" });
    const result = await analyzeQuery("cats", "http://localhost:1234");
    expect(result.intent).toBe("videos");
  });

  it("falls back gracefully on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network failure"));
    const result = await analyzeQuery("my query", "http://localhost:1234");
    expect(result).toEqual({ videoQuery: "my query", intent: "videos" });
  });

  it("falls back gracefully on malformed JSON body", async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        choices: [{ message: { content: "not json {{" } }],
      }),
    });
    const result = await analyzeQuery("my query", "http://localhost:1234");
    expect(result).toEqual({ videoQuery: "my query", intent: "videos" });
  });

  it("falls back when choices array is empty", async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ choices: [] }),
    });
    const result = await analyzeQuery("my query", "http://localhost:1234");
    expect(result).toEqual({ videoQuery: "my query", intent: "videos" });
  });

  it("uses raw userInput as videoQuery when model returns empty string", async () => {
    mockLmResponse({ videoQuery: "", intent: "videos" });
    const result = await analyzeQuery("original query", "http://localhost:1234");
    expect(result.videoQuery).toBe("original query");
  });
});

describe("classifyClickbait", () => {
  it("returns parsed classifications on success", async () => {
    const titles = ["Normal title", "YOU WON'T BELIEVE THIS!!"];
    mockLmResponse([
      { title: "Normal title", clickbait: false },
      { title: "YOU WON'T BELIEVE THIS!!", clickbait: true },
    ]);
    const result = await classifyClickbait(titles, "http://localhost:1234");
    expect(result).toEqual([
      { title: "Normal title", clickbait: false },
      { title: "YOU WON'T BELIEVE THIS!!", clickbait: true },
    ]);
  });

  it("returns all-false fallback on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network failure"));
    const titles = ["Title A", "Title B"];
    const result = await classifyClickbait(titles, "http://localhost:1234");
    expect(result).toEqual([
      { title: "Title A", clickbait: false },
      { title: "Title B", clickbait: false },
    ]);
  });

  it("returns all-false fallback on malformed JSON", async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        choices: [{ message: { content: "not an array" } }],
      }),
    });
    const titles = ["Title A"];
    const result = await classifyClickbait(titles, "http://localhost:1234");
    expect(result).toEqual([{ title: "Title A", clickbait: false }]);
  });

  it("returns empty array for empty titles input", async () => {
    mockLmResponse([]);
    const result = await classifyClickbait([], "http://localhost:1234");
    expect(result).toEqual([]);
  });
});
