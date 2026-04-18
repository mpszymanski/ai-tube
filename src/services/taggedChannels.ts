import { ChannelResult, TaggedChannel } from "../types";

const KEY = "aitube_tagged_channels";
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function getTaggedChannels(): TaggedChannel[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TaggedChannel[];
  } catch {
    return [];
  }
}

function save(channels: TaggedChannel[]): void {
  localStorage.setItem(KEY, JSON.stringify(channels));
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
