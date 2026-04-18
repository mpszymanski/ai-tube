import { VideoResult } from "../types";

interface ResultCardProps {
  video: VideoResult;
  onClick(): void;
  animationDelay?: string;
}

function formatDuration(iso: string): string {
  if (!iso) return "";
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const h = parseInt(match[1] ?? "0");
  const m = parseInt(match[2] ?? "0");
  const s = parseInt(match[3] ?? "0");
  const totalMins = h * 60 + m;
  const ss = s.toString().padStart(2, "0");
  return `${totalMins}:${ss}`;
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

export default function ResultCard({ video, onClick, animationDelay }: ResultCardProps) {
  const duration = formatDuration(video.duration);
  const views = formatViewCount(video.viewCount);
  const posted = formatPublishedAt(video.publishedAt);

  const metaParts = [video.channelTitle, views, posted].filter(Boolean);

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
        {metaParts.length > 0 && (
          <p style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 8 }}>
            {metaParts.map((part, i) => (
              <span key={i}>
                {i > 0 && <span style={{ margin: "0 3px", color: "var(--border-strong)" }}>·</span>}
                <span style={i === 0 ? { color: "var(--text-dim)" } : {}}>{part}</span>
              </span>
            ))}
          </p>
        )}
      </div>
    </button>
  );
}
