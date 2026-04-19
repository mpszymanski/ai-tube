import { useState, useRef, useEffect } from "react";
import { CogIcon } from "../ui/Icons";
import ThinkingRow from "../ui/ThinkingRow";
import { VideoResult, ChannelResult, ChannelResultWithVideos } from "../../types";
import BackButton from "../ui/BackButton";
import TagPicker from "../widgets/TagPicker";
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
import { tagStyle } from "../../utils/tagColor";
import { TopicGroup } from "../../types";
import Logo from "../ui/Logo";
import WatchTimeCounter from "../widgets/WatchTimeCounter";
import { getUsage } from "../../services/apiUsage";

interface SearchScreenProps {
  onSearch(results: VideoResult[], query: string): void;
  onGroupedSearch(groups: TopicGroup[], query: string): void;
  onChannelSearch(data: ChannelResultWithVideos, query: string): void;
  onSubscriptions(): void;
  onSettings(): void;
  todaySeconds: number;
  weekSeconds: number;
}

type Phase = "idle" | "thinking" | "channel-confirm";

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      style={{
        color: active ? "var(--accent)" : "var(--text-mute)",
        transition: "color 0.2s",
      }}
    >
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M14 14l4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
}: SearchScreenProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [inputValue, setInputValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Thinking rows
  const [row1Visible, setRow1Visible] = useState(false);
  const [row2Visible, setRow2Visible] = useState(false);
  const [row3Visible, setRow3Visible] = useState(false);
  const [row4Visible, setRow4Visible] = useState(false);
  const [originalQuery, setOriginalQuery] = useState("");
  const [rephrasedText, setRephrasedText] = useState("");
  const [typewriterDone, setTypewriterDone] = useState(false);
  const [detectedChannelName, setDetectedChannelName] = useState("");
  const [channelRowDone, setChannelRowDone] = useState(false);

  // Channel confirm
  const [channelCandidates, setChannelCandidates] = useState<ChannelResult[]>(
    [],
  );
  const [pendingVideoQuery, setPendingVideoQuery] = useState("");
  const [pendingIntent, setPendingIntent] = useState<
    "videos" | "channel" | "channel-videos"
  >("videos");

  const [isTagSearch, setIsTagSearch] = useState(false);
  const [apiUsage, setApiUsage] = useState(() => getUsage());

  useEffect(() => {
    if (phase === "idle") setApiUsage(getUsage());
  }, [phase]);

  // Tag pills
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
        const channels = await searchChannels(
          channelName,
          config.youtubeApiKey,
        );
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
        />
      </div>
    </div>
  );

  if (phase === "thinking") {
    return (
      <>
        {topbar}
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
                  {isTagSearch
                    ? "Fetching recent videos · grouping by topic…"
                    : pendingIntent === "channel"
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
      </>
    );
  }

  if (phase === "channel-confirm") {
    const confirmTopbar = (
      <div className="app__topbar" style={{ justifyContent: "space-between" }}>
        <BackButton onBack={() => setPhase("idle")} />
        <WatchTimeCounter
          todaySeconds={todaySeconds}
          weekSeconds={weekSeconds}
        />
      </div>
    );
    return (
      <>
        {confirmTopbar}
        <div className="app__main">
          <div
            style={{
              width: "100%",
              maxWidth: 620,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-mute)",
                  fontFamily: "var(--font-mono)",
                  marginBottom: 10,
                }}
              >
                Which channel did you mean?
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {channelCandidates.map((ch) => (
                  <div
                    key={ch.channelId}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleChannelSelect(ch)}
                    onKeyDown={(e) =>
                      (e.key === "Enter" || e.key === " ") &&
                      handleChannelSelect(ch)
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      background: "var(--bg-elev)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      padding: "12px 16px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.background = "var(--bg-card)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.background = "var(--bg-elev)";
                    }}
                  >
                    {ch.thumbnailUrl && (
                      <img
                        src={ch.thumbnailUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          flexShrink: 0,
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          color: "var(--text)",
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                      >
                        {ch.title}
                      </span>
                      {ch.description && (
                        <span
                          style={{
                            color: "var(--text-mute)",
                            fontSize: 12,
                            fontFamily: "var(--font-mono)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ch.description}
                        </span>
                      )}
                    </div>
                    <TagPicker channel={ch} size="sm" />
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => handleChannelSelect(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-mute)",
                fontSize: 13,
                cursor: "pointer",
                padding: "4px 0",
                textAlign: "left",
                fontFamily: "var(--font-mono)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text-dim)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-mute)")
              }
            >
              Search all of YouTube instead →
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {topbar}
      <div className="app__main" style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            background:
              "radial-gradient(ellipse 720px 520px at 50% 38%, rgba(255,68,68,0.10) 0%, rgba(255,68,68,0.04) 35%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: 620,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
          }}
        >
          <div
            style={{
              marginBottom: 44,
              animation: "rowIn 0.5s var(--ease) both",
            }}
          >
            <Logo size="xl" />
          </div>
          {allTags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 20,
                justifyContent: "center",
                animation: "rowIn 0.5s var(--ease) 80ms both",
              }}
            >
              {allTags.map((tag) => {
                const s = tagStyle(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    style={{
                      fontSize: 12,
                      fontFamily: "var(--font-mono)",
                      padding: "5px 11px",
                      borderRadius: "var(--radius-sm)",
                      border: `1px solid ${s.borderColor}`,
                      color: s.color,
                      background: s.background,
                      cursor: "pointer",
                      transition:
                        "transform 0.18s var(--ease), filter 0.18s var(--ease)",
                      willChange: "transform",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.filter = "brightness(1.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "";
                      e.currentTarget.style.filter = "";
                    }}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          )}
          <form
            onSubmit={handleSubmit}
            style={{
              width: "100%",
              animation: "rowIn 0.5s var(--ease) 160ms both",
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          >
            <div style={{ position: "relative", width: "100%" }}>
              <span
                style={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  display: "flex",
                }}
              >
                <SearchIcon active={focused} />
              </span>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="What do you want to watch?"
                style={{
                  width: "100%",
                  padding: "18px 52px",
                  background: focused ? "var(--bg-card)" : "var(--bg-elev)",
                  border: `1px solid ${focused ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: 14,
                  color: "var(--text)",
                  fontSize: 16,
                  fontFamily: "var(--font-sans)",
                  outline: "none",
                  boxShadow: focused
                    ? "0 0 0 3px var(--accent-ring), 0 12px 32px -8px rgba(255,68,68,0.25), inset 0 1px 0 rgba(255,255,255,0.05)"
                    : "inset 0 1px 0 rgba(255,255,255,0.03)",
                  transition:
                    "background 0.2s var(--ease), border-color 0.2s var(--ease), box-shadow 0.25s var(--ease)",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-mute)",
                  opacity: focused ? 1 : 0,
                  transition: "opacity 0.15s",
                  pointerEvents: "none",
                }}
              >
                ⏎
              </span>
            </div>
          </form>
          <div
            style={{
              width: "100%",
              marginTop: 8,
              animation: "rowIn 0.5s var(--ease) 240ms both",
            }}
          >
            <div
              style={{
                height: 3,
                background: "var(--border)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, (apiUsage.used / apiUsage.max) * 100)}%`,
                  background: "var(--accent)",
                  transition: "width 0.4s var(--ease)",
                }}
              />
            </div>
            <p
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: "var(--text-mute)",
                margin: "4px 0 0",
                textAlign: "right",
              }}
            >
              {apiUsage.used.toLocaleString()} / {apiUsage.max.toLocaleString()}{" "}
              units today
            </p>
          </div>
          {error && (
            <p
              style={{
                color: "var(--accent)",
                fontSize: 13,
                marginTop: 12,
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
