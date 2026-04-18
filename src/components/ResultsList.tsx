import { useState } from "react";
import { VideoResult } from "../types";
import ResultCard from "./ResultCard";
import WatchTimeCounter from "./WatchTimeCounter";
import Toggle from "./Toggle";

interface ResultsListProps {
  results: VideoResult[];
  query: string;
  todaySeconds: number;
  weekSeconds: number;
  onSelect(videoId: string): void;
  onBack(): void;
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EmptyBoxIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3 8l8-5 8 5v8l-8 5-8-5V8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3 8l8 5 8-5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M11 13v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const delays = ["0.05s", "0.10s", "0.15s", "0.20s", "0.25s", "0.30s", "0.35s", "0.40s", "0.45s", "0.50s"];

export default function ResultsList({ results, query, todaySeconds, weekSeconds, onSelect, onBack }: ResultsListProps) {
  const [filterOn, setFilterOn] = useState(true);
  const visibleResults = filterOn ? results.filter((r) => !r.isClickbait) : results;

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
        <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
              Results for "<span style={{ color: "var(--text)" }}>{query}</span>"
            </span>
            <Toggle checked={filterOn} onChange={setFilterOn} label="Clickbait filter" />
          </div>

          {results.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 40 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: "var(--bg-elev)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-dim)",
                }}
              >
                <EmptyBoxIcon />
              </div>
              <p style={{ fontSize: 17, fontWeight: 500, color: "var(--text)" }}>No results found</p>
              <p style={{ fontSize: 13.5, color: "var(--text-dim)", textAlign: "center" }}>
                Try a different search query.
              </p>
              <button
                onClick={onBack}
                style={{
                  marginTop: 4,
                  padding: "8px 16px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  color: "var(--text-dim)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Try another query
              </button>
            </div>
          ) : visibleResults.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 40 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: "var(--bg-elev)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-dim)",
                }}
              >
                <EmptyBoxIcon />
              </div>
              <p style={{ fontSize: 17, fontWeight: 500, color: "var(--text)" }}>All results are clickbait</p>
              <p style={{ fontSize: 13.5, color: "var(--text-dim)", textAlign: "center" }}>
                All results were marked as clickbait. Turn off the filter to see them.
              </p>
            </div>
          ) : (
            visibleResults.map((video, i) => (
              <ResultCard
                key={video.videoId}
                video={video}
                onClick={() => onSelect(video.videoId)}
                animationDelay={delays[i] ?? "0.05s"}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
