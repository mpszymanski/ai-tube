import { useEffect, useRef } from "react";
import { VideoResult } from "../../types";
import { addSeconds } from "../../services/watchTime";
import ScreenShell from "../layout/ScreenShell";
import SubscribeButton from "../widgets/SubscribeButton";
import { formatViewCount, formatPublishedAt } from "../../utils/formatters";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface PlayerScreenProps {
  video: VideoResult;
  onBack(): void;
}

export default function PlayerScreen({ video, onBack }: PlayerScreenProps) {
  const playerDivRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearWatchInterval() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function initPlayer() {
    if (!playerDivRef.current) return;
    playerRef.current = new window.YT.Player(playerDivRef.current, {
      videoId: video.videoId,
      playerVars: { autoplay: 1, enablejsapi: 1 },
      events: {
        onStateChange: (event: any) => {
          const state = event.data;
          if (state === window.YT.PlayerState.PLAYING) {
            clearWatchInterval();
            intervalRef.current = setInterval(() => addSeconds(1), 1000);
          } else {
            clearWatchInterval();
          }
        },
      },
    });
  }

  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      if (!document.getElementById("yt-iframe-api")) {
        const script = document.createElement("script");
        script.id = "yt-iframe-api";
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }
    }

    return () => {
      clearWatchInterval();
      if (playerRef.current?.destroy) {
        try { playerRef.current.destroy(); } catch { /* ignore */ }
      }
      playerRef.current = null;
    };
  }, [video.videoId]);

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
              {video.channelId && (
                <SubscribeButton
                  channel={{
                    channelId: video.channelId,
                    title: video.channelTitle,
                    thumbnailUrl: video.channelThumbnailUrl ?? "",
                    description: "",
                  }}
                />
              )}
            </div>
          </div>
        </div>
    </ScreenShell>
  );
}
