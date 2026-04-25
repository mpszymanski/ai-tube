import type { TimePeriod } from "../types";

export function timePeriodToPublishedAfter(period?: TimePeriod): string | undefined {
  if (!period) return undefined;
  const d = new Date();
  switch (period) {
    case "today":      d.setHours(0, 0, 0, 0); break;
    case "this_week":  d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); break;
    case "this_month": d.setDate(1); d.setHours(0, 0, 0, 0); break;
    case "this_year":  d.setMonth(0, 1); d.setHours(0, 0, 0, 0); break;
  }
  return d.toISOString();
}
