import { useState } from "react";
import { TopicGroup } from "../types";
import ResultCard from "./ResultCard";
import WatchTimeCounter from "./WatchTimeCounter";
import Toggle from "./Toggle";
import BackButton from "./BackButton";
import { ANIMATION_DELAYS } from "../utils/constants";

interface GroupedResultsListProps {
  groups: TopicGroup[];
  query: string;
  todaySeconds: number;
  weekSeconds: number;
  onSelect(videoId: string): void;
  onBack(): void;
}

export default function GroupedResultsList({ groups, query, todaySeconds, weekSeconds, onSelect, onBack }: GroupedResultsListProps) {
  const [filterOn, setFilterOn] = useState(true);

  const visibleGroups = groups
    .map((g) => ({
      ...g,
      videos: filterOn ? g.videos.filter((v) => !v.isClickbait) : g.videos,
    }))
    .filter((g) => g.videos.length > 0);

  let globalIndex = 0;

  return (
    <div className="app">
      <div className="app__topbar">
        <BackButton onBack={onBack} />
        <WatchTimeCounter todaySeconds={todaySeconds} weekSeconds={weekSeconds} />
      </div>

      <div className="app__main" style={{ justifyContent: "flex-start", paddingTop: 96 }}>
        <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
              Topics for "<span style={{ color: "var(--text)" }}>{query}</span>"
            </span>
            <Toggle checked={filterOn} onChange={setFilterOn} label="Clickbait filter" />
          </div>

          {visibleGroups.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingTop: 40 }}>
              <p style={{ fontSize: 14, color: "var(--text-dim)" }}>No results found.</p>
              <button
                onClick={onBack}
                style={{
                  padding: "8px 16px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  color: "var(--text-dim)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Go back
              </button>
            </div>
          ) : (
            visibleGroups.map((group) => (
              <div key={group.topic} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-mute)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {group.topic}
                </span>
                {group.videos.slice(0, 3).map((video) => {
                  const delay = ANIMATION_DELAYS[globalIndex] ?? "0.05s";
                  globalIndex++;
                  return (
                    <ResultCard
                      key={video.videoId}
                      video={video}
                      onClick={() => onSelect(video.videoId)}
                      animationDelay={delay}
                    />
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
