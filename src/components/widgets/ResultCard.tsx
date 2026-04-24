import { useState } from "react";
import { VideoResult } from "../../types";
import { formatDuration, formatViewCount, formatPublishedAt } from "../../utils/formatters";
import { ClipboardIcon, CheckIcon } from "../ui/Icons";

interface ResultCardProps {
  video: VideoResult;
  onClick(): void;
  animationDelay?: string;
  disabled?: boolean;
  isSeen?: boolean;
}

export default function ResultCard({ video, onClick, animationDelay, disabled, isSeen }: ResultCardProps) {
  const duration = formatDuration(video.duration);
  const views = formatViewCount(video.viewCount);
  const posted = formatPublishedAt(video.publishedAt);
  const showSeenStyle = !!isSeen && !disabled;
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    const url = `https://www.youtube.com/watch?v=${video.videoId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 16,
        width: "100%",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left",
        animation: (disabled || showSeenStyle) ? "none" : `rowIn 0.4s var(--ease) forwards`,
        animationDelay: (disabled || showSeenStyle) ? undefined : (animationDelay ?? "0s"),
        opacity: disabled ? 0.5 : showSeenStyle ? 0.75 : 0,
        transition: "background 0.15s var(--ease), border-color 0.15s var(--ease)",
      }}
      onMouseEnter={disabled ? undefined : (e) => {
        e.currentTarget.style.background = "var(--bg-hover)";
        e.currentTarget.style.borderColor = "var(--border-strong)";
      }}
      onMouseLeave={disabled ? undefined : (e) => {
        e.currentTarget.style.background = "var(--bg-card)";
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: "relative", flexShrink: 0, width: 168, height: 94, borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: showSeenStyle ? "grayscale(70%)" : "none" }}
        />
        {isSeen && (
          <span
            style={{
              position: "absolute",
              top: 4,
              left: 4,
              background: "rgba(0,0,0,0.75)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              padding: "2px 6px",
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              gap: 3,
              lineHeight: 1,
            }}
          >
            ✓ Watched
          </span>
        )}
        {duration && (
          <span
            style={{
              position: "absolute",
              bottom: 4,
              right: 4,
              background: "rgba(0,0,0,0.85)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 500,
              fontFamily: "var(--font-mono)",
              padding: "2px 5px",
              borderRadius: 3,
            }}
          >
            {duration}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 94, overflow: "hidden" }}>
        <p
          style={{
            fontSize: 14.5,
            fontWeight: 500,
            color: "var(--text)",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {video.title}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
          {video.channelThumbnailUrl && (
            <img
              src={video.channelThumbnailUrl}
              alt=""
              referrerPolicy="no-referrer"
              style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, objectFit: "cover" }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          )}
          <p style={{ fontSize: 12, color: "var(--text-mute)", margin: 0 }}>
            <span style={{ color: "var(--text-dim)" }}>{video.channelTitle}</span>
            {views && <><span style={{ margin: "0 3px", color: "var(--border-strong)" }}>·</span><span>{views}</span></>}
            {posted && <><span style={{ margin: "0 3px", color: "var(--border-strong)" }}>·</span><span>{posted}</span></>}
          </p>
        </div>
      </div>
    </button>
    <button
      onClick={handleCopy}
      title="Copy video link"
      style={{
        position: "absolute",
        bottom: 10,
        right: 10,
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 8px",
        background: copied ? "var(--accent)" : "var(--bg-elev)",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-sm)",
        color: copied ? "#fff" : "var(--text-dim)",
        fontSize: 11,
        fontFamily: "var(--font-sans)",
        cursor: "pointer",
        opacity: hovered || copied ? 1 : 0,
        transition: "opacity 0.15s, background 0.15s, color 0.15s",
        pointerEvents: hovered || copied ? "auto" : "none",
      }}
    >
      {copied ? <CheckIcon size={13} /> : <ClipboardIcon size={13} />}
      {copied ? "Copied!" : "Copy link"}
    </button>
    </div>
  );
}
