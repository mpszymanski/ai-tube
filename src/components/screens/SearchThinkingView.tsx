import ThinkingRow from "../ui/ThinkingRow";

interface SearchThinkingViewProps {
  row1Visible: boolean;
  row2Visible: boolean;
  row3Visible: boolean;
  row4Visible: boolean;
  originalQuery: string;
  rephrasedText: string;
  typewriterDone: boolean;
  detectedChannelName: string;
  channelRowDone: boolean;
  pendingIntent: "videos" | "channel" | "channel-videos";
  error: string | null;
}

export default function SearchThinkingView({
  row1Visible,
  row2Visible,
  row3Visible,
  row4Visible,
  originalQuery,
  rephrasedText,
  typewriterDone,
  detectedChannelName,
  channelRowDone,
  pendingIntent,
  error,
}: SearchThinkingViewProps) {
  return (
    <div className="app__main">
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {row1Visible && (
          <ThinkingRow label="You" status="done">
            <span style={{ color: "var(--text)" }}>{originalQuery}</span>
          </ThinkingRow>
        )}
        {row2Visible && (
          <ThinkingRow label="Query" status={typewriterDone ? "done" : "pending"}>
            <span style={{ color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 14 }}>
              {rephrasedText}
              {!typewriterDone && (
                <span style={{ animation: "blink 1s steps(2) infinite", display: "inline-block" }}>▌</span>
              )}
            </span>
          </ThinkingRow>
        )}
        {row3Visible && detectedChannelName && (
          <ThinkingRow label="Channel" status={channelRowDone ? "done" : "pending"}>
            <span style={{ color: "var(--text-dim)" }}>
              Looking up <span style={{ color: "var(--text)" }}>{detectedChannelName}</span>…
            </span>
          </ThinkingRow>
        )}
        {row4Visible && (
          <ThinkingRow label="Search" status="pending">
            <span style={{ color: "var(--text-dim)" }}>
              {pendingIntent === "channel"
                ? "Loading latest videos…"
                : "Querying YouTube · filtering clickbait…"}
            </span>
          </ThinkingRow>
        )}
        {error && (
          <p
            style={{
              color: "var(--accent)",
              fontSize: 13,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
