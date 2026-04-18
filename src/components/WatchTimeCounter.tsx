import { formatTime } from "../services/watchTime";

interface CounterProps {
  todaySeconds: number;
  weekSeconds: number;
}

export default function WatchTimeCounter({ todaySeconds, weekSeconds }: CounterProps) {
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
      <span style={{ color: "var(--text-mute)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Today
      </span>
      <span style={{ color: "var(--text)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
        {formatTime(todaySeconds)}
      </span>
      <span style={{ color: "var(--border-strong)" }}>·</span>
      <span style={{ color: "var(--text-mute)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Week
      </span>
      <span style={{ color: "var(--text)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
        {formatTime(weekSeconds)}
      </span>
    </div>
  );
}
