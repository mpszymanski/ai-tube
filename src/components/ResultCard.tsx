import { VideoResult } from "../types";
import { formatDuration, formatViewCount, formatPublishedAt } from "../utils/formatters";

interface ResultCardProps {
  video: VideoResult;
  onClick(): void;
  animationDelay?: string;
}

export default function ResultCard({ video, onClick, animationDelay }: ResultCardProps) {
  const duration = formatDuration(video.duration);
  const views = formatViewCount(video.viewCount);
  const posted = formatPublishedAt(video.publishedAt);

  return (
    <button
      onClick={onClick}
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
        cursor: "pointer",
        textAlign: "left",
        animation: `rowIn 0.4s var(--ease) forwards`,
        animationDelay: animationDelay ?? "0s",
        opacity: 0,
        transition: "background 0.15s var(--ease), border-color 0.15s var(--ease)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg-hover)";
        e.currentTarget.style.borderColor = "var(--border-strong)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg-card)";
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: "relative", flexShrink: 0, width: 168, height: 94, borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
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
  );
}
