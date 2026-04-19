import { describe, it, expect, beforeEach, vi } from "vitest";
import { InMemoryAdapter } from "./storage/InMemoryAdapter";
import { hydrate, getTaggedChannels, addTag, removeTag, getChannelTags, getChannelsByTag, getAllTags, normalizeTag, subscribeToChanges, _reset } from "./taggedChannels";
import type { ChannelResult } from "../types";

const channel1: ChannelResult = {
  channelId: "ch1",
  title: "Tech Channel",
  thumbnailUrl: "https://example.com/thumb1.jpg",
  description: "A tech channel",
};

const channel2: ChannelResult = {
  channelId: "ch2",
  title: "Science Channel",
  thumbnailUrl: "https://example.com/thumb2.jpg",
  description: "A science channel",
};

let adapter: InMemoryAdapter;

beforeEach(async () => {
  localStorage.clear();
  adapter = new InMemoryAdapter();
  _reset();
  await hydrate(adapter);
});

describe("getTaggedChannels", () => {
  it("returns empty array when nothing is stored", () => {
    expect(getTaggedChannels()).toEqual([]);
  });
});

describe("normalizeTag", () => {
  it("lowercases, trims, replaces spaces with dashes, strips special chars", () => {
    expect(normalizeTag("  Hello World! ")).toBe("hello-world");
  });
});

describe("addTag", () => {
  it("adds channel with a tag", () => {
    addTag(channel1, "tech");
    const channels = getTaggedChannels();
    expect(channels).toHaveLength(1);
    expect(channels[0].channelId).toBe("ch1");
    expect(channels[0].tags).toContain("tech");
  });

  it("is idempotent for the same tag", () => {
    addTag(channel1, "tech");
    addTag(channel1, "tech");
    expect(getChannelTags("ch1")).toEqual(["tech"]);
  });

  it("normalizes the tag before storing", () => {
    addTag(channel1, "  My Tag  ");
    expect(getChannelTags("ch1")).toContain("my-tag");
  });
});

describe("removeTag", () => {
  it("removes a tag from a channel", () => {
    addTag(channel1, "tech");
    addTag(channel1, "news");
    removeTag("ch1", "tech");
    expect(getChannelTags("ch1")).toEqual(["news"]);
  });

  it("removes channel entirely when all tags are removed", () => {
    addTag(channel1, "tech");
    removeTag("ch1", "tech");
    expect(getTaggedChannels()).toHaveLength(0);
  });
});

describe("getChannelsByTag", () => {
  it("returns channels with the given tag", () => {
    addTag(channel1, "tech");
    addTag(channel2, "science");
    expect(getChannelsByTag("tech")).toHaveLength(1);
    expect(getChannelsByTag("tech")[0].channelId).toBe("ch1");
  });
});

describe("getAllTags", () => {
  it("returns sorted unique set of all tags", () => {
    addTag(channel1, "tech");
    addTag(channel2, "science");
    addTag(channel1, "news");
    expect(getAllTags()).toEqual(["news", "science", "tech"]);
  });
});

describe("subscribeToChanges", () => {
  it("fires listener after addTag", () => {
    const listener = vi.fn();
    subscribeToChanges(listener);
    addTag(channel1, "tech");
    expect(listener).toHaveBeenCalledOnce();
  });

  it("unsubscribe stops notifications", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToChanges(listener);
    unsubscribe();
    addTag(channel1, "tech");
    expect(listener).not.toHaveBeenCalled();
  });
});
