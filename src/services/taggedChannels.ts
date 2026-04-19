import type { ChannelResult, TaggedChannel } from "../types";
import type { StorageAdapter } from "./storage/adapter";
import { KEYS } from "./storage/adapter";
import { getAdapter } from "./storage";

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

let cache: TaggedChannel[] | null = null;

export async function hydrate(adapter?: StorageAdapter): Promise<void> {
  const a = adapter ?? getAdapter();
  try {
    const raw = await a.get(KEYS.TAGGED_CHANNELS);
    cache = raw ? (JSON.parse(raw) as TaggedChannel[]) : [];
  } catch {
    cache = [];
  }
}

export function getTaggedChannels(): TaggedChannel[] {
  return cache ?? [];
}

function save(channels: TaggedChannel[]): void {
  cache = channels;
  getAdapter()
    .set(KEYS.TAGGED_CHANNELS, JSON.stringify(channels))
    .catch(() => console.warn("aitube: tagged channels not saved"));
  notify();
}

export function subscribeToChanges(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getAllTags(): string[] {
  const all = getTaggedChannels().flatMap((ch) => ch.tags);
  return [...new Set(all)].sort();
}

export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");
}

export function addTag(channel: ChannelResult, tag: string): void {
  const norm = normalizeTag(tag);
  if (!norm) return;
  const all = getTaggedChannels();
  const idx = all.findIndex((ch) => ch.channelId === channel.channelId);
  if (idx === -1) {
    save([...all, { ...channel, tags: [norm] }]);
  } else {
    if (all[idx].tags.includes(norm)) return;
    const updated = [...all];
    updated[idx] = { ...updated[idx], tags: [...updated[idx].tags, norm] };
    save(updated);
  }
}

export function removeTag(channelId: string, tag: string): void {
  const all = getTaggedChannels();
  const updated = all
    .map((ch) =>
      ch.channelId === channelId
        ? { ...ch, tags: ch.tags.filter((t) => t !== tag) }
        : ch
    )
    .filter((ch) => ch.tags.length > 0);
  save(updated);
}

export function getChannelTags(channelId: string): string[] {
  return getTaggedChannels().find((ch) => ch.channelId === channelId)?.tags ?? [];
}

export function getChannelsByTag(tag: string): TaggedChannel[] {
  return getTaggedChannels().filter((ch) => ch.tags.includes(tag));
}

export function _reset(): void {
  cache = null;
}
