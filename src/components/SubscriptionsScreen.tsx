import { useState } from "react";
import { ChannelResult } from "../types";
import { getSubscriptions, unsubscribe } from "../services/subscriptions";
import WatchTimeCounter from "./WatchTimeCounter";
import BackButton from "./BackButton";

interface SubscriptionsScreenProps {
  todaySeconds: number;
  weekSeconds: number;
  onBack(): void;
  onChannelSelect(channel: ChannelResult): Promise<void>;
}

export default function SubscriptionsScreen({ todaySeconds, weekSeconds, onBack, onChannelSelect }: SubscriptionsScreenProps) {
  const [channels, setChannels] = useState<ChannelResult[]>(() => getSubscriptions());
  const [loadingChannelId, setLoadingChannelId] = useState<string | null>(null);

  async function handleBrowse(ch: ChannelResult) {
    if (loadingChannelId) return;
    setLoadingChannelId(ch.channelId);
    try {
      await onChannelSelect(ch);
    } finally {
      setLoadingChannelId(null);
    }
  }

  function handleUnsubscribe(e: React.MouseEvent, channelId: string) {
    e.stopPropagation();
    unsubscribe(channelId);
    setChannels((prev) => prev.filter((ch) => ch.channelId !== channelId));
  }

  return (
    <div className="app">
      <div className="app__topbar">
        <BackButton onBack={onBack} />
        <WatchTimeCounter todaySeconds={todaySeconds} weekSeconds={weekSeconds} />
      </div>

      <div className="app__main" style={{ justifyContent: "flex-start", paddingTop: 96 }}>
        <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", gap: 16 }}>
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Subscriptions
          </span>

          {channels.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingTop: 40 }}>
              <p style={{ fontSize: 14, color: "var(--text-dim)" }}>No subscriptions yet.</p>
              <p style={{ fontSize: 12, color: "var(--text-mute)" }}>Subscribe to channels from video results or channel pages.</p>
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
                    style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0, objectFit: "cover" }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
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
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleBrowse(ch)}
                    disabled={!!loadingChannelId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      background: "var(--accent)",
                      border: "1px solid transparent",
                      borderRadius: "var(--radius-sm)",
                      color: "#fff",
                      fontSize: 12,
                      fontFamily: "var(--font-mono)",
                      padding: "6px 14px",
                      cursor: loadingChannelId ? "default" : "pointer",
                      opacity: loadingChannelId && loadingChannelId !== ch.channelId ? 0.5 : 1,
                      transition: "opacity 0.15s",
                      minWidth: 64,
                    }}
                  >
                    {loadingChannelId === ch.channelId ? (
                      <div style={{
                        width: 11,
                        height: 11,
                        borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.4)",
                        borderTopColor: "#fff",
                        animation: "spin 0.7s linear infinite",
                      }} />
                    ) : "Browse"}
                  </button>
                  <button
                    onClick={(e) => handleUnsubscribe(e, ch.channelId)}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border-strong)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-dim)",
                      fontSize: 12,
                      fontFamily: "var(--font-mono)",
                      padding: "6px 14px",
                      cursor: "pointer",
                      transition: "border-color 0.15s, color 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text-dim)"; }}
                  >
                    Unsubscribe
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
