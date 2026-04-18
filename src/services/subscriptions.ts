import { ChannelResult } from "../types";

const KEY = "aitube_subscriptions";

export function getSubscriptions(): ChannelResult[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChannelResult[];
  } catch {
    return [];
  }
}

export function isSubscribed(channelId: string): boolean {
  return getSubscriptions().some((ch) => ch.channelId === channelId);
}

export function subscribe(channel: ChannelResult): void {
  const current = getSubscriptions();
  if (current.some((ch) => ch.channelId === channel.channelId)) return;
  localStorage.setItem(KEY, JSON.stringify([...current, channel]));
}

export function unsubscribe(channelId: string): void {
  const current = getSubscriptions().filter((ch) => ch.channelId !== channelId);
  localStorage.setItem(KEY, JSON.stringify(current));
}
