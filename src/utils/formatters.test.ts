import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { formatDuration, formatViewCount, formatPublishedAt } from "./formatters";

describe("formatViewCount", () => {
  it("returns empty string for empty input", () => {
    expect(formatViewCount("")).toBe("");
  });

  it("returns empty string for non-numeric input", () => {
    expect(formatViewCount("abc")).toBe("");
  });

  it("formats counts under 1K as plain number", () => {
    expect(formatViewCount("500")).toBe("500 views");
    expect(formatViewCount("999")).toBe("999 views");
  });

  it("formats counts in thousands", () => {
    expect(formatViewCount("1500")).toBe("1.5K views");
    expect(formatViewCount("10000")).toBe("10K views");
  });

  it("strips trailing .0 from K values", () => {
    expect(formatViewCount("2000")).toBe("2K views");
  });

  it("formats counts in millions", () => {
    expect(formatViewCount("1000000")).toBe("1M views");
    expect(formatViewCount("2500000")).toBe("2.5M views");
  });

  it("formats counts in billions", () => {
    expect(formatViewCount("1000000000")).toBe("1B views");
    expect(formatViewCount("1500000000")).toBe("1.5B views");
  });
});

describe("formatDuration", () => {
  it("returns empty string for empty input", () => {
    expect(formatDuration("")).toBe("");
  });

  it("returns empty string for non-matching input", () => {
    expect(formatDuration("invalid")).toBe("");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration("PT3M45S")).toBe("3:45");
  });

  it("pads seconds with leading zero", () => {
    expect(formatDuration("PT30S")).toBe("0:30");
    expect(formatDuration("PT1M3S")).toBe("1:03");
  });

  it("converts hours to total minutes", () => {
    expect(formatDuration("PT1H5M3S")).toBe("65:03");
    expect(formatDuration("PT1H")).toBe("60:00");
  });

  it("handles missing seconds component", () => {
    expect(formatDuration("PT10M")).toBe("10:00");
  });
});

describe("formatPublishedAt", () => {
  const fixedNow = new Date("2024-01-15T12:00:00Z");

  beforeEach(() => {
    vi.setSystemTime(fixedNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty string for empty input", () => {
    expect(formatPublishedAt("")).toBe("");
  });

  it("returns 'today' for same-day dates", () => {
    expect(formatPublishedAt("2024-01-15T08:00:00Z")).toBe("today");
  });

  it("formats days ago", () => {
    expect(formatPublishedAt("2024-01-13T12:00:00Z")).toBe("2 days ago");
    expect(formatPublishedAt("2024-01-14T12:00:00Z")).toBe("1 day ago");
  });

  it("formats weeks ago", () => {
    expect(formatPublishedAt("2024-01-08T12:00:00Z")).toBe("1 week ago");
    expect(formatPublishedAt("2024-01-01T12:00:00Z")).toBe("2 weeks ago");
  });

  it("formats months ago", () => {
    expect(formatPublishedAt("2023-12-01T12:00:00Z")).toBe("1 month ago");
    expect(formatPublishedAt("2023-09-15T12:00:00Z")).toBe("4 months ago");
  });

  it("formats years ago", () => {
    expect(formatPublishedAt("2023-01-15T12:00:00Z")).toBe("1 year ago");
    expect(formatPublishedAt("2022-01-15T12:00:00Z")).toBe("2 years ago");
  });
});
