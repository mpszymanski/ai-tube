import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { InMemoryAdapter } from "./storage/InMemoryAdapter";
import { KEYS } from "./storage/adapter";
import { hydrate, recordUnits, getUsage, _reset } from "./apiUsage";

let adapter: InMemoryAdapter;

beforeEach(async () => {
  localStorage.clear();
  adapter = new InMemoryAdapter();
  _reset();
  vi.useRealTimers();
  await hydrate(adapter);
});

afterEach(() => {
  vi.useRealTimers();
  _reset();
});

describe("getUsage", () => {
  it("returns {used: 0, max: 10000} when empty", () => {
    expect(getUsage()).toEqual({ used: 0, max: 10000 });
  });

  it("returns defaults when stored JSON is malformed", async () => {
    await adapter.set(KEYS.API_QUOTA, "bad-json{{");
    _reset();
    await hydrate(adapter);
    expect(getUsage()).toEqual({ used: 0, max: 10000 });
  });
});

describe("recordUnits", () => {
  it("increments the usage counter", () => {
    recordUnits(100);
    recordUnits(50);
    expect(getUsage().used).toBe(150);
  });

  it("resets counter when date changes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-19T12:00:00Z"));

    adapter = new InMemoryAdapter();
    _reset();
    await hydrate(adapter);

    recordUnits(500);
    expect(getUsage().used).toBe(500);

    vi.setSystemTime(new Date("2026-04-20T12:00:00Z"));
    expect(getUsage().used).toBe(0);
  });
});
