import { useEffect, useRef, useState } from "react";
import { VideoResult, ChannelResult } from "../types";
import { addSeconds } from "../services/watchTime";
import { isSubscribed, subscribe, unsubscribe } from "../services/subscriptions";
import WatchTimeCounter from "./WatchTimeCounter";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface PlayerScreenProps {
  video: VideoResult;
  todaySeconds: number;
  weekSeconds: number;
  onBack(): void;
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatPublishedAt(iso: string): string {
  if (!iso) return "";
  const published = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - published.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return "today";
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
}

function formatViewCount(raw: string): string {
  if (!raw) return "";
  const n = parseInt(raw);
  if (isNaN(n)) return "";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B views`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K views`;
  return `${n} views`;
}

export default function PlayerScreen({ video, todaySeconds, weekSeconds, onBack }: PlayerScreenProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearWatchInterval() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function initPlayer() {
    if (!iframeRef.current) return;
    playerRef.current = new window.YT.Player(iframeRef.current, {
      events: {
        onReady: (event: any) => {
          if (event.target.getPlayerState() === window.YT.PlayerState.PLAYING) {
            clearWatchInterval();
            intervalRef.current = setInterval(() => addSeconds(1), 1000);
          }
        },
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

  const backBtnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "transparent",
    border: "none",
    color: "var(--text-dim)",
    fontSize: 13,
    padding: "8px 12px 8px 8px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    transition: "color 0.15s, background 0.15s",
  };

  const [subscribed, setSubscribed] = useState(() =>
    video.channelId ? isSubscribed(video.channelId) : false
  );

  function handleSubscribe() {
    if (!video.channelId) return;
    const channel: ChannelResult = {
      channelId: video.channelId,
      title: video.channelTitle,
      thumbnailUrl: video.channelThumbnailUrl ?? "",
      description: "",
    };
    if (subscribed) {
      unsubscribe(video.channelId);
      setSubscribed(false);
    } else {
      subscribe(channel);
      setSubscribed(true);
    }
  }

  const metaParts = [formatViewCount(video.viewCount), formatPublishedAt(video.publishedAt)].filter(Boolean);

  return (
    <div className="app">
      <div className="app__topbar">
        <button
          onClick={onBack}
          style={backBtnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--bg-elev)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-dim)"; e.currentTarget.style.background = "transparent"; }}
        >
          <ArrowIcon />
          Back
        </button>
        <WatchTimeCounter todaySeconds={todaySeconds} weekSeconds={weekSeconds} />
      </div>

      <div className="app__main" style={{ justifyContent: "flex-start", paddingTop: 96 }}>
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
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${video.videoId}?enablejsapi=1&autoplay=1`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              title={video.title}
            />
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
                <button
                  onClick={handleSubscribe}
                  style={{
                    flexShrink: 0,
                    background: subscribed ? "transparent" : "var(--accent)",
                    border: subscribed ? "1px solid var(--border-strong)" : "1px solid transparent",
                    borderRadius: "var(--radius-sm)",
                    color: subscribed ? "var(--text-dim)" : "#fff",
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    padding: "6px 14px",
                    cursor: "pointer",
                    transition: "background 0.15s, color 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (subscribed) {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.color = "var(--accent)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (subscribed) {
                      e.currentTarget.style.borderColor = "var(--border-strong)";
                      e.currentTarget.style.color = "var(--text-dim)";
                    }
                  }}
                >
                  {subscribed ? "Subscribed" : "Subscribe"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
