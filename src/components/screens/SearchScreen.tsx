import { useState, useRef, useEffect } from "react";
import { CogIcon } from "../ui/Icons";
import { VideoResult, ChannelResult, ChannelResultWithVideos } from "../../types";
import { getConfig } from "../../services/config";
import {
  analyzeQuery,
  classifyClickbait,
  groupVideosByTopic,
} from "../../services/lmStudio";
import {
  searchYouTube,
  searchChannels,
  getChannelLatestVideos,
} from "../../services/youtube";
import {
  getAllTags,
  getChannelsByTag,
  normalizeTag,
  subscribeToChanges,
} from "../../services/taggedChannels";
import { TopicGroup } from "../../types";
import WatchTimeCounter from "../widgets/WatchTimeCounter";
import { getUsage } from "../../services/apiUsage";
import SearchThinkingView from "./SearchThinkingView";
import ChannelConfirmView from "./ChannelConfirmView";
import SearchIdleView from "./SearchIdleView";

interface SearchScreenProps {
  onSearch(results: VideoResult[], query: string): void;
  onGroupedSearch(groups: TopicGroup[], query: string): void;
  onChannelSearch(data: ChannelResultWithVideos, query: string): void;
  onSubscriptions(): void;
  onSettings(): void;
  todaySeconds: number;
  weekSeconds: number;
  dailyLimitSeconds: number;
  weeklyLimitSeconds: number;
  isLocked: boolean;
}

type Phase = "idle" | "thinking" | "channel-confirm";

function SubscriptionsIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <rect x="1" y="3" width="14" height="2" rx="1" fill="currentColor" />
      <rect x="1" y="7" width="14" height="2" rx="1" fill="currentColor" />
      <rect x="1" y="11" width="14" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

export default function SearchScreen({
  onSearch,
  onGroupedSearch,
  onChannelSearch,
  onSubscriptions,
  onSettings,
  todaySeconds,
  weekSeconds,
  dailyLimitSeconds,
  weeklyLimitSeconds,
  isLocked,
}: SearchScreenProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [inputValue, setInputValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [row1Visible, setRow1Visible] = useState(false);
  const [row2Visible, setRow2Visible] = useState(false);
  const [row3Visible, setRow3Visible] = useState(false);
  const [row4Visible, setRow4Visible] = useState(false);
  const [originalQuery, setOriginalQuery] = useState("");
  const [rephrasedText, setRephrasedText] = useState("");
  const [typewriterDone, setTypewriterDone] = useState(false);
  const [detectedChannelName, setDetectedChannelName] = useState("");
  const [channelRowDone, setChannelRowDone] = useState(false);

  const [channelCandidates, setChannelCandidates] = useState<ChannelResult[]>([]);
  const [pendingVideoQuery, setPendingVideoQuery] = useState("");
  const [pendingIntent, setPendingIntent] = useState<"videos" | "channel" | "channel-videos">("videos");

  const [isTagSearch, setIsTagSearch] = useState(false);
  const [apiUsage, setApiUsage] = useState(() => getUsage());

  useEffect(() => {
    if (phase === "idle") setApiUsage(getUsage());
  }, [phase]);

  const [allTags, setAllTags] = useState(() => getAllTags());
  useEffect(() => {
    setAllTags(getAllTags());
    return subscribeToChanges(() => setAllTags(getAllTags()));
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const typewriterTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function startTypewriter(text: string) {
    if (typewriterTimer.current) clearInterval(typewriterTimer.current);
    let i = 0;
    setRephrasedText("");
    setTypewriterDone(false);
    typewriterTimer.current = setInterval(() => {
      i++;
      setRephrasedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(typewriterTimer.current!);
        setTypewriterDone(true);
      }
    }, 22);
  }

  useEffect(() => {
    return () => {
      if (typewriterTimer.current) clearInterval(typewriterTimer.current);
    };
  }, []);

  async function doChannelSearch(channel: ChannelResult, displayQuery: string) {
    const config = getConfig();
    const searchStart = Date.now();

    try {
      const allResults = await getChannelLatestVideos(
        channel.channelId,
        config.youtubeApiKey,
        channel.thumbnailUrl,
      );
      const titles = allResults.map((r) => r.title);
      const classified = await classifyClickbait(titles, config.lmStudioUrl);
      const clickbaitMap = new Map(
        classified.map((item) => [item.title, item.clickbait]),
      );
      const latestVideos = allResults
        .map((r) => ({ ...r, isClickbait: clickbaitMap.get(r.title) ?? false }))
        .slice(0, 10);

      const delay = Math.max(0, 1200 - (Date.now() - searchStart));
      setTimeout(
        () => onChannelSearch({ channel, latestVideos }, displayQuery),
        delay,
      );
    } catch {
      const delay = Math.max(0, 1200 - (Date.now() - searchStart));
      setTimeout(() => {
        setPhase("idle");
        setError("Failed to load channel videos. Check your API key.");
      }, delay);
    }
  }

  async function doVideoSearch(
    videoQuery: string,
    displayQuery: string,
    channelId?: string,
  ) {
    const config = getConfig();
    const searchStart = Date.now();
    let results: VideoResult[] = [];

    try {
      const allResults = await searchYouTube(
        videoQuery,
        config.youtubeApiKey,
        channelId,
      );
      const titles = allResults.map((r) => r.title);
      const classified = await classifyClickbait(titles, config.lmStudioUrl);
      const clickbaitMap = new Map(
        classified.map((item) => [item.title, item.clickbait]),
      );
      results = allResults
        .map((r) => ({ ...r, isClickbait: clickbaitMap.get(r.title) ?? false }))
        .sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime(),
        )
        .slice(0, 10);

      if (results.length === 0) {
        const delay = Math.max(0, 1200 - (Date.now() - searchStart));
        setTimeout(() => {
          setPhase("idle");
          setError("No results found. Try a different search.");
        }, delay);
        return;
      }
    } catch (err: any) {
      const msg = err?.message ?? "";
      const delay = Math.max(0, 1200 - (Date.now() - searchStart));
      setTimeout(() => {
        setPhase("idle");
        if (msg.includes("LM Studio") || msg.includes("localhost")) {
          setError("Cannot reach LM Studio. Make sure it's running.");
        } else {
          setError("YouTube search failed. Check your API key.");
        }
      }, delay);
      return;
    }

    const delay = Math.max(0, 1200 - (Date.now() - searchStart));
    setTimeout(() => onSearch(results, displayQuery), delay);
  }

  async function doTagVideoSearch(
    filter: string,
    displayQuery: string,
    channels: Array<{ channelId: string; thumbnailUrl: string }>,
  ) {
    const config = getConfig();
    const searchStart = Date.now();
    setRow4Visible(true);

    try {
      const settled = await Promise.allSettled(
        channels.map((ch) =>
          getChannelLatestVideos(
            ch.channelId,
            config.youtubeApiKey,
            ch.thumbnailUrl,
          ),
        ),
      );

      const allVideos: VideoResult[] = [];
      const seen = new Set<string>();
      for (const result of settled) {
        if (result.status === "fulfilled") {
          for (const video of result.value) {
            if (!seen.has(video.videoId)) {
              seen.add(video.videoId);
              allVideos.push(video);
            }
          }
        }
      }

      if (allVideos.length === 0) {
        const delay = Math.max(0, 1200 - (Date.now() - searchStart));
        setTimeout(() => {
          setPhase("idle");
          setError("No recent videos found for this tag.");
        }, delay);
        return;
      }

      const videoEntries = allVideos.map((v) => ({
        videoId: v.videoId,
        title: v.title,
        channelTitle: v.channelTitle,
      }));
      const rawGroups = await groupVideosByTopic(
        videoEntries,
        filter,
        config.lmStudioUrl,
      );

      const videoMap = new Map(allVideos.map((v) => [v.videoId, v]));
      const topicGroups: TopicGroup[] = rawGroups
        .map((g) => ({
          topic: g.topic,
          videos: g.videoIds
            .map((id) => videoMap.get(id))
            .filter(Boolean) as VideoResult[],
        }))
        .filter((g) => g.videos.length > 0);

      if (topicGroups.length === 0) {
        const delay = Math.max(0, 1200 - (Date.now() - searchStart));
        setTimeout(() => {
          setPhase("idle");
          setError("Could not group videos by topic.");
        }, delay);
        return;
      }

      const delay = Math.max(0, 1200 - (Date.now() - searchStart));
      setTimeout(() => onGroupedSearch(topicGroups, displayQuery), delay);
    } catch {
      const delay = Math.max(0, 1200 - (Date.now() - searchStart));
      setTimeout(() => {
        setPhase("idle");
        setError("Tag search failed. Check your API key.");
      }, delay);
    }
  }

  async function handleTagClick(tag: string) {
    if (isLocked) return;
    const tagChannels = getChannelsByTag(tag);
    if (tagChannels.length === 0) return;
    setError(null);
    setPhase("thinking");
    setIsTagSearch(true);
    setOriginalQuery(`#${tag}`);
    setRephrasedText("");
    setTypewriterDone(false);
    setRow1Visible(false);
    setRow2Visible(false);
    setRow3Visible(false);
    setRow4Visible(false);
    setTimeout(() => setRow1Visible(true), 0);
    await doTagVideoSearch("", `#${tag}`, tagChannels);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked) return;
    const query = inputValue.trim();
    if (!query) return;

    const tagMatch = query.match(/^#([a-zA-Z0-9-]+)\s*(.*)/);
    if (tagMatch) {
      const tagName = normalizeTag(tagMatch[1]);
      const restQuery = tagMatch[2].trim();
      const tagChannels = getChannelsByTag(tagName);
      if (tagChannels.length > 0) {
        setError(null);
        setPhase("thinking");
        setIsTagSearch(true);
        setOriginalQuery(query);
        setRephrasedText("");
        setTypewriterDone(false);
        setRow1Visible(false);
        setRow2Visible(false);
        setRow3Visible(false);
        setRow4Visible(false);
        setTimeout(() => setRow1Visible(true), 0);
        await doTagVideoSearch(restQuery, query, tagChannels);
        return;
      }
    }

    setIsTagSearch(false);
    setError(null);
    setPhase("thinking");
    setOriginalQuery(query);
    setRephrasedText("");
    setTypewriterDone(false);
    setRow1Visible(false);
    setRow2Visible(false);
    setRow3Visible(false);
    setRow4Visible(false);
    setDetectedChannelName("");
    setChannelRowDone(false);

    setTimeout(() => setRow1Visible(true), 0);
    setTimeout(() => setRow2Visible(true), 450);

    const config = getConfig();

    let videoQuery = query;
    let intent: "videos" | "channel" | "channel-videos" = "videos";
    let channelName: string | undefined;
    try {
      const result = await analyzeQuery(query, config.lmStudioUrl);
      videoQuery = result.videoQuery;
      intent = result.intent;
      channelName = result.channelName;
    } catch {
      // fallback to original query
    }

    startTypewriter(videoQuery);
    setPendingVideoQuery(videoQuery);
    setPendingIntent(intent);

    let resolvedChannelId: string | undefined;
    let resolvedChannel: ChannelResult | undefined;

    if (channelName && (intent === "channel" || intent === "channel-videos")) {
      setDetectedChannelName(channelName);
      setRow3Visible(true);

      try {
        const channels = await searchChannels(channelName, config.youtubeApiKey);
        if (channels.length === 1) {
          resolvedChannelId = channels[0].channelId;
          resolvedChannel = channels[0];
          setChannelRowDone(true);
        } else if (channels.length > 1) {
          setChannelCandidates(channels);
          setPhase("channel-confirm");
          return;
        } else {
          setChannelRowDone(true);
        }
      } catch {
        setChannelRowDone(true);
      }
    }

    setRow4Visible(true);
    if (intent === "channel" && resolvedChannel) {
      await doChannelSearch(resolvedChannel, query);
    } else {
      await doVideoSearch(videoQuery, query, resolvedChannelId);
    }
  }

  async function handleChannelSelect(channel: ChannelResult | null) {
    setPhase("thinking");
    setRow4Visible(true);
    if (pendingIntent === "channel" && channel) {
      await doChannelSearch(channel, originalQuery);
    } else {
      await doVideoSearch(
        pendingVideoQuery,
        originalQuery,
        channel?.channelId ?? undefined,
      );
    }
  }

  const subsBtnStyle: React.CSSProperties = {
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

  const topbar = (
    <div className="app__topbar" style={{ justifyContent: "space-between" }}>
      <button
        onClick={onSubscriptions}
        style={subsBtnStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--text)";
          e.currentTarget.style.background = "var(--bg-elev)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-dim)";
          e.currentTarget.style.background = "transparent";
        }}
      >
        <SubscriptionsIcon />
        Subscriptions
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={onSettings}
          title="Settings"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            color: "var(--text-dim)",
            padding: 8,
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text)";
            e.currentTarget.style.background = "var(--bg-elev)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-dim)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <CogIcon size={16} />
        </button>
        <WatchTimeCounter
          todaySeconds={todaySeconds}
          weekSeconds={weekSeconds}
          dailyLimitSeconds={dailyLimitSeconds}
          weeklyLimitSeconds={weeklyLimitSeconds}
        />
      </div>
    </div>
  );

  if (phase === "thinking") {
    return (
      <>
        {topbar}
        <SearchThinkingView
          row1Visible={row1Visible}
          row2Visible={row2Visible}
          row3Visible={row3Visible}
          row4Visible={row4Visible}
          originalQuery={originalQuery}
          rephrasedText={rephrasedText}
          typewriterDone={typewriterDone}
          detectedChannelName={detectedChannelName}
          channelRowDone={channelRowDone}
          isTagSearch={isTagSearch}
          pendingIntent={pendingIntent}
          error={error}
        />
      </>
    );
  }

  if (phase === "channel-confirm") {
    return (
      <ChannelConfirmView
        channelCandidates={channelCandidates}
        onSelect={handleChannelSelect}
        onBack={() => setPhase("idle")}
        todaySeconds={todaySeconds}
        weekSeconds={weekSeconds}
        dailyLimitSeconds={dailyLimitSeconds}
        weeklyLimitSeconds={weeklyLimitSeconds}
      />
    );
  }

  return (
    <>
      {topbar}
      <SearchIdleView
        allTags={allTags}
        isLocked={isLocked}
        apiUsage={apiUsage}
        error={error}
        inputValue={inputValue}
        focused={focused}
        inputRef={inputRef}
        onInputChange={setInputValue}
        onSubmit={handleSubmit}
        onTagClick={handleTagClick}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </>
  );
}
