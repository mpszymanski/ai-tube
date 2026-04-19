import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { InMemoryAdapter } from "./storage/InMemoryAdapter";
import { KEYS } from "./storage/adapter";
import { hydrate, getWatchTimeData, addSeconds, getTodaySeconds, getWeekSeconds, formatTime, _reset } from "./watchTime";

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

describe("getWatchTimeData", () => {
  it("returns empty daily map when nothing is stored", () => {
    expect(getWatchTimeData()).toEqual({ daily: {} });
  });

  it("returns defaults when stored JSON is malformed", async () => {
    await adapter.set(KEYS.WATCH_TIME, "bad-json{{");
    _reset();
    await hydrate(adapter);
    expect(getWatchTimeData()).toEqual({ daily: {} });
  });
});

describe("addSeconds / getTodaySeconds / getWeekSeconds", () => {
  it("getTodaySeconds returns 0 when empty", () => {
    expect(getTodaySeconds()).toBe(0);
  });

  it("addSeconds accumulates on today's key", () => {
    addSeconds(30);
    addSeconds(15);
    expect(getTodaySeconds()).toBe(45);
  });

  it("getWeekSeconds sums all daily entries", () => {
    addSeconds(100);
    addSeconds(200);
    expect(getWeekSeconds()).toBe(300);
  });

  it("pruneOldDays drops entries older than 7 days", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-19T12:00:00Z"));

    adapter = new InMemoryAdapter();
    _reset();
    await hydrate(adapter);

    addSeconds(60);
    expect(getTodaySeconds()).toBe(60);

    // Move 8 days forward — old entry should be pruned
    vi.setSystemTime(new Date("2026-04-27T12:00:00Z"));
    expect(getTodaySeconds()).toBe(0);
  });
});

describe("formatTime", () => {
  it("formats zero seconds", () => {
    expect(formatTime(0)).toBe("0h 0m");
  });

  it("formats 3661 seconds as 1h 1m", () => {
    expect(formatTime(3661)).toBe("1h 1m");
  });
});
