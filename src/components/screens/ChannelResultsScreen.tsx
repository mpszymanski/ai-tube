import { useState } from "react";
import { ChannelResultWithVideos } from "../../types";
import ResultCard from "../widgets/ResultCard";
import Toggle from "../ui/Toggle";
import ScreenShell from "../layout/ScreenShell";
import TagPicker from "../widgets/TagPicker";
import { ANIMATION_DELAYS } from "../../utils/constants";
import { useWatchLimit } from "../../context/WatchLimitContext";

interface ChannelResultsScreenProps {
  data: ChannelResultWithVideos;
  query: string;
  onSelect(videoId: string): void;
  onBack(): void;
}

export default function ChannelResultsScreen({ data, onSelect, onBack }: ChannelResultsScreenProps) {
  const { isLocked } = useWatchLimit();
  const [filterOn, setFilterOn] = useState(true);
  const { channel, latestVideos } = data;
  const visibleVideos = filterOn ? latestVideos.filter((r) => !r.isClickbait) : latestVideos;

  return (
    <ScreenShell onBack={onBack}>
      <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Channel card */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: 16,
              animation: "rowIn 0.4s var(--ease) forwards",
            }}
          >
            {channel.thumbnailUrl && (
              <img
                src={channel.thumbnailUrl}
                alt=""
                referrerPolicy="no-referrer"
                style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0, objectFit: "cover" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
              <span style={{ color: "var(--text)", fontSize: 17, fontWeight: 600 }}>{channel.title}</span>
              {channel.description && (
                <span
                  style={{
                    color: "var(--text-mute)",
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {channel.description}
                </span>
              )}
            </div>
            <TagPicker channel={channel} />
          </div>

          {/* Videos header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Latest videos
            </span>
            <Toggle checked={filterOn} onChange={setFilterOn} label="Clickbait filter" />
          </div>

          {/* Video list */}
          {visibleVideos.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingTop: 24 }}>
              <p style={{ fontSize: 14, color: "var(--text-dim)" }}>
                {latestVideos.length === 0
                  ? "No recent videos found."
                  : "All videos were marked as clickbait. Turn off the filter to see them."}
              </p>
            </div>
          ) : (
            visibleVideos.map((video, i) => (
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
