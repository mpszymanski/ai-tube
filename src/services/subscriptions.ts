import type { ChannelResult } from "../types";
import type { StorageAdapter } from "./storage/adapter";
import { KEYS } from "./storage/adapter";
import { getAdapter } from "./storage";
import { log } from "./logger";

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

let cache: ChannelResult[] | null = null;

export async function hydrate(adapter?: StorageAdapter): Promise<void> {
  const a = adapter ?? getAdapter();
  try {
    const raw = await a.get(KEYS.SUBSCRIPTIONS);
    cache = raw ? (JSON.parse(raw) as ChannelResult[]) : [];
  } catch {
    cache = [];
  }
}

export function getSubscriptions(): ChannelResult[] {
  return cache ?? [];
}

export function isSubscribed(channelId: string): boolean {
  return getSubscriptions().some((ch) => ch.channelId === channelId);
}

function save(channels: ChannelResult[]): void {
  cache = channels;
  getAdapter()
    .set(KEYS.SUBSCRIPTIONS, JSON.stringify(channels))
    .catch(() => console.warn("aitube: subscriptions not saved"));
  notify();
}

export function subscribe(channel: ChannelResult): void {
  if (isSubscribed(channel.channelId)) return;
  save([...getSubscriptions(), channel]);
  log("user", "subscribe", { channelId: channel.channelId, title: channel.title });
}

export function unsubscribe(channelId: string): void {
  save(getSubscriptions().filter((ch) => ch.channelId !== channelId));
  log("user", "unsubscribe", { channelId });
}

export function subscribeToChanges(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
