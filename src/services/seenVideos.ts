import { KEYS } from "./storage/adapter";
import { getAdapter } from "./storage";

export async function hydrateSeenVideos(): Promise<Set<string>> {
  try {
    const raw = await getAdapter().get(KEYS.SEEN_VIDEOS);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function persistSeenVideos(ids: Set<string>): void {
  getAdapter().set(KEYS.SEEN_VIDEOS, JSON.stringify([...ids]));
}
