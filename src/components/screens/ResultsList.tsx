import { useState } from "react";
import { VideoResult } from "../../types";
import ResultCard from "../widgets/ResultCard";
import Toggle from "../ui/Toggle";
import ScreenShell from "../layout/ScreenShell";
import EmptyState from "../ui/EmptyState";
import { ANIMATION_DELAYS } from "../../utils/constants";

interface ResultsListProps {
  results: VideoResult[];
  query: string;
  todaySeconds: number;
  weekSeconds: number;
  dailyLimitSeconds: number;
  weeklyLimitSeconds: number;
  isLocked: boolean;
  onSelect(videoId: string): void;
  onBack(): void;
  onSettings(): void;
}

export default function ResultsList({ results, query, todaySeconds, weekSeconds, dailyLimitSeconds, weeklyLimitSeconds, isLocked, onSelect, onBack, onSettings }: ResultsListProps) {
  const [filterOn, setFilterOn] = useState(true);
  const visibleResults = filterOn ? results.filter((r) => !r.isClickbait) : results;

  return (
    <ScreenShell onBack={onBack} onSettings={onSettings} todaySeconds={todaySeconds} weekSeconds={weekSeconds} dailyLimitSeconds={dailyLimitSeconds} weeklyLimitSeconds={weeklyLimitSeconds}>
      <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
            Results for "<span style={{ color: "var(--text)" }}>{query}</span>"
          </span>
          <Toggle checked={filterOn} onChange={setFilterOn} label="Clickbait filter" />
        </div>

        {results.length === 0 ? (
          <EmptyState
            title="No results found"
            subtitle="Try a different search query."
            actionLabel="Try another query"
            onAction={onBack}
          />
        ) : visibleResults.length === 0 ? (
          <EmptyState
            title="All results are clickbait"
            subtitle="All results were marked as clickbait. Turn off the filter to see them."
          />
        ) : (
          visibleResults.map((video, i) => (
            <ResultCard
              key={video.videoId}
              video={video}
              onClick={() => onSelect(video.videoId)}
              animationDelay={ANIMATION_DELAYS[i] ?? "0.05s"}
              disabled={isLocked}
            />
          ))
        )}
      </div>
    </ScreenShell>
  );
}
