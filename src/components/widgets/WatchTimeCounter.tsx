import { formatTime } from "../../services/watchTime";

interface CounterProps {
  todaySeconds: number;
  weekSeconds: number;
  dailyLimitSeconds: number;
  weeklyLimitSeconds: number;
}

export default function WatchTimeCounter({ todaySeconds, weekSeconds, dailyLimitSeconds, weeklyLimitSeconds }: CounterProps) {
  const dailyExceeded = todaySeconds >= dailyLimitSeconds;
  const weeklyExceeded = weekSeconds >= weeklyLimitSeconds;
  const isLocked = dailyExceeded || weeklyExceeded;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderRadius: 999,
        padding: "6px 12px 6px 10px",
        fontSize: 13,
        fontFamily: "var(--font-mono)",
      }}
    >
      {isLocked ? (
        <svg
          width="12"
          height="14"
          viewBox="0 0 12 14"
          fill="none"
          style={{ flexShrink: 0, color: "var(--accent)" }}
        >
          <rect x="1" y="6" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 6V4a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--accent)",
            boxShadow: "0 0 0 3px var(--accent-soft)",
            flexShrink: 0,
          }}
        />
      )}
      <span style={{ color: "var(--text-mute)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Today
      </span>
      <span style={{ color: dailyExceeded ? "var(--accent)" : "var(--text)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
        {formatTime(todaySeconds)}
      </span>
      <span style={{ color: "var(--border-strong)" }}>·</span>
      <span style={{ color: "var(--text-mute)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Week
      </span>
      <span style={{ color: weeklyExceeded ? "var(--accent)" : "var(--text)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
        {formatTime(weekSeconds)}
      </span>
    </div>
  );
}
