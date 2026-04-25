import { useState, useRef, useEffect } from "react";
import { VideoResult, ChannelResult, ChannelResultWithVideos, TimePeriod } from "../../types";
import { getConfig } from "../../services/config";
import { analyzeQuery } from "../../services/lmStudio";
import { searchChannels } from "../../services/youtube";
import { runVideoSearch, runChannelSearch } from "../../services/searchService";
import { getSubscriptions, subscribeToChanges } from "../../services/subscriptions";
import { getHistory, addToHistory } from "../../services/searchHistory";
import { recordUnits } from "../../services/apiUsage";
import { timePeriodToPublishedAfter } from "../../utils/dates";
import WatchTimeCounter from "../widgets/WatchTimeCounter";
import SettingsButton from "../ui/SettingsButton";
import { getUsage } from "../../services/apiUsage";
import { useWatchLimit } from "../../context/WatchLimitContext";
import SearchThinkingView from "./SearchThinkingView";
import ChannelConfirmView from "./ChannelConfirmView";
import SearchIdleView from "./SearchIdleView";

interface SearchScreenProps {
  onSearch(results: VideoResult[], query: string): void;
  onChannelSearch(data: ChannelResultWithVideos, query: string): void;
  onSubscriptions(): void;
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
  onChannelSearch,
  onSubscriptions,
}: SearchScreenProps) {
  const { isLocked } = useWatchLimit();
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
  const [pendingPublishedAfter, setPendingPublishedAfter] = useState<string | undefined>(undefined);

  const [apiUsage, setApiUsage] = useState(() => getUsage());
  const [history, setHistory] = useState<string[]>(() => getHistory());

  useEffect(() => {
    if (phase === "idle") setApiUsage(getUsage());
  }, [phase]);

  function sampleChannels(channels: ChannelResult[]): ChannelResult[] {
    const copy = [...channels];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, 8).sort((a, b) => a.title.localeCompare(b.title));
  }

  const [subscribedChannels, setSubscribedChannels] = useState<ChannelResult[]>(() => sampleChannels(getSubscriptions()));
  useEffect(() => {
    setSubscribedChannels(sampleChannels(getSubscriptions()));
    return subscribeToChanges(() => setSubscribedChannels(sampleChannels(getSubscriptions())));
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const typewriterTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function afterMinDelay(start: number, fn: () => void): void {
    setTimeout(fn, Math.max(0, 1200 - (Date.now() - start)));
  }

  function beginThinking(q: string): void {
    setError(null);
    setPhase("thinking");
    setOriginalQuery(q);
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
  }

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

  async function doChannelSearch(channel: ChannelResult, displayQuery: string, publishedAfter?: string) {
    const config = getConfig();
    const searchStart = Date.now();
    try {
      const result = await runChannelSearch({ channel, publishedAfter, apiKey: config.youtubeApiKey });
      afterMinDelay(searchStart, () => onChannelSearch(result, displayQuery));
    } catch {
      afterMinDelay(searchStart, () => {
        setPhase("idle");
        setError("Failed to load channel videos. Check your API key.");
      });
    }
  }

  async function doVideoSearch(
    videoQuery: string,
    displayQuery: string,
    channelId?: string,
    publishedAfter?: string,
  ) {
    const config = getConfig();
    const searchStart = Date.now();
    try {
      const results = await runVideoSearch({ query: videoQuery, channelId, publishedAfter, apiKey: config.youtubeApiKey });
      if (results.length === 0) {
        afterMinDelay(searchStart, () => {
          setPhase("idle");
          setError("No results found. Try a different search.");
        });
        return;
      }
      afterMinDelay(searchStart, () => onSearch(results, displayQuery));
    } catch (err: any) {
      const msg = err?.message ?? "";
      afterMinDelay(searchStart, () => {
        setPhase("idle");
        if (msg.includes("LM Studio") || msg.includes("localhost")) {
          setError("Cannot reach LM Studio. Make sure it's running.");
        } else {
          setError("YouTube search failed. Check your API key.");
        }
      });
    }
  }

  async function handleChannelClick(channel: ChannelResult) {
    if (isLocked) return;
    beginThinking(channel.title);
    setRow2Visible(false);
    setRow4Visible(true);
    await doChannelSearch(channel, channel.title);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked) return;
    const query = inputValue.trim();
    if (!query) return;

    addToHistory(query);
    setHistory(getHistory());
    beginThinking(query);

    const config = getConfig();

    let videoQuery = query;
    let intent: "videos" | "channel" | "channel-videos" = "videos";
    let channelName: string | undefined;
    let timePeriod: TimePeriod | undefined;
    try {
      const result = await analyzeQuery(query);
      videoQuery = result.videoQuery;
      intent = result.intent;
      channelName = result.channelName;
      timePeriod = result.timePeriod;
    } catch {
      // fallback to original query
    }

    const publishedAfter = timePeriodToPublishedAfter(timePeriod);
    startTypewriter(videoQuery);
    setPendingVideoQuery(videoQuery);
    setPendingIntent(intent);
    setPendingPublishedAfter(publishedAfter);

    let resolvedChannelId: string | undefined;
    let resolvedChannel: ChannelResult | undefined;

    if (channelName && (intent === "channel" || intent === "channel-videos")) {
      setDetectedChannelName(channelName);
      setRow3Visible(true);

      try {
        const channels = await searchChannels(channelName, config.youtubeApiKey, recordUnits);
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
      await doChannelSearch(resolvedChannel, query, publishedAfter);
    } else {
      await doVideoSearch(videoQuery, query, resolvedChannelId, publishedAfter);
    }
  }

  async function handleChannelSelect(channel: ChannelResult | null) {
    setPhase("thinking");
    setRow4Visible(true);
    if (pendingIntent === "channel" && channel) {
      await doChannelSearch(channel, originalQuery, pendingPublishedAfter);
    } else {
      await doVideoSearch(
        pendingVideoQuery,
        originalQuery,
        channel?.channelId ?? undefined,
        pendingPublishedAfter,
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
        <SettingsButton />
        <WatchTimeCounter />
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
      />
    );
  }

  return (
    <>
      {topbar}
      <SearchIdleView
        subscribedChannels={subscribedChannels}
        isLocked={isLocked}
        apiUsage={apiUsage}
        error={error}
        inputValue={inputValue}
        focused={focused}
        inputRef={inputRef}
        history={history}
        onInputChange={setInputValue}
        onSubmit={handleSubmit}
        onChannelClick={handleChannelClick}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </>
  );
}
