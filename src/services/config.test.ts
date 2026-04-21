import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryAdapter } from "./storage/InMemoryAdapter";
import { KEYS } from "./storage/adapter";
import { hydrate, getConfig, saveConfig, isConfigured, _reset } from "./config";

let adapter: InMemoryAdapter;

beforeEach(async () => {
  localStorage.clear();
  adapter = new InMemoryAdapter();
  _reset();
  await hydrate(adapter);
});

describe("getConfig", () => {
  it("returns defaults when nothing is stored", () => {
    const config = getConfig();
    expect(config.youtubeApiKey).toBe("");
  });

  it("merges stored values with defaults", async () => {
    adapter.seed(KEYS.CONFIG, { youtubeApiKey: "my-key" });
    _reset();
    await hydrate(adapter);
    const config = getConfig();
    expect(config.youtubeApiKey).toBe("my-key");
  });

  it("returns defaults when stored JSON is malformed", async () => {
    await adapter.set(KEYS.CONFIG, "not-json{{");
    _reset();
    await hydrate(adapter);
    const config = getConfig();
    expect(config.youtubeApiKey).toBe("");
  });
});

describe("saveConfig", () => {
  it("saves and reads back values", () => {
    saveConfig({ youtubeApiKey: "abc", dailyLimitSeconds: 3600, weeklyLimitSeconds: 14400 });
    const config = getConfig();
    expect(config.youtubeApiKey).toBe("abc");
  });
});

describe("isConfigured", () => {
  it("returns false when no key is set", () => {
    expect(isConfigured()).toBe(false);
  });

  it("returns true after saving a key", () => {
    saveConfig({ youtubeApiKey: "AIzaSyFakeKey12345678", dailyLimitSeconds: 3600, weeklyLimitSeconds: 14400 });
    expect(isConfigured()).toBe(true);
  });
});
