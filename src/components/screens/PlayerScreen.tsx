import { useRef } from "react";
import { VideoResult } from "../../types";
import { addSeconds } from "../../services/watchTime";
import { useYouTubePlayer } from "../../hooks/useYouTubePlayer";
import { useCopyLink } from "../../hooks/useCopyLink";
import ScreenShell from "../layout/ScreenShell";
import SubscribeButton from "../widgets/SubscribeButton";
import { formatViewCount, formatPublishedAt } from "../../utils/formatters";
import { ClipboardIcon, CheckIcon } from "../ui/Icons";

interface PlayerScreenProps {
  video: VideoResult;
  onBack(): void;
  onGoToChannel?(): void;
}

export default function PlayerScreen({ video, onBack, onGoToChannel }: PlayerScreenProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearWatchInterval() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  const playerDivRef = useYouTubePlayer(video.videoId, {
    onPlaying: () => {
      clearWatchInterval();
      intervalRef.current = setInterval(() => addSeconds(1), 1000);
    },
    onPaused: () => clearWatchInterval(),
  });

  const { copied, handleCopy } = useCopyLink(video.videoId);

  const metaParts = [formatViewCount(video.viewCount), formatPublishedAt(video.publishedAt)].filter(Boolean);

  return (
    <ScreenShell onBack={onBack}>
      <div style={{ width: "100%", maxWidth: 760, display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              background: "#000",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            <div ref={playerDivRef} style={{ width: "100%", height: "100%" }} />
          </div>

          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.015em", color: "var(--text)" }}>
              {video.title}
            </h1>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                {video.channelThumbnailUrl && (
                  <img
                    src={video.channelThumbnailUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, objectFit: "cover" }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {video.channelTitle}
                  </span>
                  {metaParts.length > 0 && (
                    <span style={{ fontSize: 12, color: "var(--text-mute)" }}>
                      {metaParts.map((part, i) => (
                        <span key={i}>
                          {i > 0 && <span style={{ margin: "0 3px", color: "var(--border-strong)" }}>·</span>}
                          {part}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={handleCopy}
                    title="Copy video link"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 12,
                      fontFamily: "var(--font-mono)",
                      padding: "6px 14px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-strong)",
                      background: copied ? "var(--accent)" : "transparent",
                      color: copied ? "#fff" : "var(--text-dim)",
                      cursor: "pointer",
                      transition: "border-color 0.15s, color 0.15s, background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!copied) {
                        e.currentTarget.style.borderColor = "var(--text-dim)";
                        e.currentTarget.style.color = "var(--text)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!copied) {
                        e.currentTarget.style.borderColor = "var(--border-strong)";
                        e.currentTarget.style.color = "var(--text-dim)";
                      }
                    }}
                  >
                    {copied ? <CheckIcon size={13} /> : <ClipboardIcon size={13} />}
                    {copied ? "Copied!" : "Copy link"}
                  </button>
              {video.channelId && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {onGoToChannel && (
                    <button
                      onClick={onGoToChannel}
                      style={{
                        fontSize: 12,
                        fontFamily: "var(--font-mono)",
                        padding: "6px 14px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-strong)",
                        background: "transparent",
                        color: "var(--text-dim)",
                        cursor: "pointer",
                        transition: "border-color 0.15s, color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--text-dim)";
                        e.currentTarget.style.color = "var(--text)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-strong)";
                        e.currentTarget.style.color = "var(--text-dim)";
                      }}
                    >
                      Go to channel
                    </button>
                  )}
                  <SubscribeButton
                    channel={{
                      channelId: video.channelId,
                      title: video.channelTitle,
                      thumbnailUrl: video.channelThumbnailUrl ?? "",
                      description: "",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}
