import { useState, useEffect } from "react";
import { ChannelResult } from "../../types";
import { getSubscriptions, unsubscribe, subscribeToChanges } from "../../services/subscriptions";
import ScreenShell from "../layout/ScreenShell";
import Button from "../ui/Button";
import { useWatchLimit } from "../../context/WatchLimitContext";

interface SubscriptionsScreenProps {
  onBack(): void;
  onChannelSelect(channel: ChannelResult): Promise<void>;
}

export default function SubscriptionsScreen({ onBack, onChannelSelect }: SubscriptionsScreenProps) {
  const { isLocked } = useWatchLimit();
  const [channels, setChannels] = useState<ChannelResult[]>(() => getSubscriptions());
  const [loadingChannelId, setLoadingChannelId] = useState<string | null>(null);

  useEffect(() => {
    setChannels(getSubscriptions());
    return subscribeToChanges(() => setChannels(getSubscriptions()));
  }, []);

  async function handleBrowse(ch: ChannelResult) {
    if (loadingChannelId || isLocked) return;
    setLoadingChannelId(ch.channelId);
    try {
      await onChannelSelect(ch);
    } finally {
      setLoadingChannelId(null);
    }
  }

  return (
    <ScreenShell onBack={onBack}>
      <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", gap: 24 }}>
        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Subscriptions
        </span>

        {channels.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingTop: 40 }}>
            <p style={{ fontSize: 14, color: "var(--text-dim)" }}>No subscriptions yet.</p>
            <p style={{ fontSize: 12, color: "var(--text-mute)" }}>Use Subscribe on any channel to save it here.</p>
          </div>
        ) : (
          channels.map((ch, i) => (
            <div
              key={ch.channelId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "var(--bg-elev)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: 16,
                animation: "rowIn 0.4s var(--ease) forwards",
                animationDelay: `${i * 0.05}s`,
                opacity: 0,
              }}
            >
              {ch.thumbnailUrl && (
                <img
                  src={ch.thumbnailUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0, objectFit: "cover" }}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
                <span style={{ color: "var(--text)", fontSize: 15, fontWeight: 600 }}>{ch.title}</span>
                {ch.description && (
                  <span
                    style={{
                      color: "var(--text-mute)",
                      fontSize: 12,
                      fontFamily: "var(--font-mono)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ch.description}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Button onClick={() => unsubscribe(ch.channelId)}>Remove</Button>
                <Button
                  variant="primary"
                  loading={loadingChannelId === ch.channelId}
                  disabled={isLocked || (!!loadingChannelId && loadingChannelId !== ch.channelId)}
                  onClick={() => handleBrowse(ch)}
                  style={{ minWidth: 64 }}
                >
                  Browse
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </ScreenShell>
  );
}
