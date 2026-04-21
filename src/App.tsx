import { useState, useEffect } from "react";
import { AppScreen, VideoResult, ChannelResult, ChannelResultWithVideos } from "./types";
import { hydrate as hydrateConfig, isConfigured, getConfig } from "./services/config";
import { hydrate as hydrateWatchTime, getTodaySeconds, getWeekSeconds } from "./services/watchTime";
import { hydrate as hydrateSubscriptions } from "./services/subscriptions";
import { hydrate as hydrateApiUsage } from "./services/apiUsage";
import { hydrateSeenVideos, persistSeenVideos } from "./services/seenVideos";
import { getChannelLatestVideos } from "./services/youtube";
import { classifyClickbait } from "./services/lmStudio";
import { ensureModelServer } from "./services/modelServer";
import { WatchLimitProvider } from "./context/WatchLimitContext";
import SetupScreen from "./components/screens/SetupScreen";
import SearchScreen from "./components/screens/SearchScreen";
import ResultsList from "./components/screens/ResultsList";
import PlayerScreen from "./components/screens/PlayerScreen";
import ChannelResultsScreen from "./components/screens/ChannelResultsScreen";
import SubscriptionsScreen from "./components/screens/SubscriptionsScreen";

async function bootstrapStorage(): Promise<void> {
  await Promise.all([
    hydrateConfig(),
    hydrateWatchTime(),
    hydrateSubscriptions(),
    hydrateApiUsage(),
  ]);
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [modelStatus, setModelStatus] = useState<"starting" | "ready" | "error">("starting");

  useEffect(() => {
    bootstrapStorage().then(() => setReady(true));
    ensureModelServer()
      .then(() => setModelStatus("ready"))
      .catch(() => setModelStatus("error"));
  }, []);

  const [screen, setScreen] = useState<AppScreen>("search");
  const [results, setResults] = useState<VideoResult[]>([]);
  const [channelData, setChannelData] = useState<ChannelResultWithVideos | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoResult | null>(null);
  const [query, setQuery] = useState("");
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [weekSeconds, setWeekSeconds] = useState(0);
  const [seenVideoIds, setSeenVideoIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!ready) return;
    setScreen(isConfigured() ? "search" : "setup");
    setTodaySeconds(getTodaySeconds());
    setWeekSeconds(getWeekSeconds());
    hydrateSeenVideos().then(setSeenVideoIds);
  }, [ready]);

  useEffect(() => {
    const id = setInterval(() => {
      setTodaySeconds(getTodaySeconds());
      setWeekSeconds(getWeekSeconds());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  function handleSearch(newResults: VideoResult[], searchQuery: string) {
    setResults(newResults);
    setQuery(searchQuery);
    setScreen("results");
  }

  function handleChannelSearch(data: ChannelResultWithVideos, searchQuery: string) {
    setChannelData(data);
    setQuery(searchQuery);
    setScreen("channel-results");
  }

  function handleSelect(videoId: string) {
    const allVideos =
      screen === "channel-results" && channelData
        ? channelData.latestVideos
        : results;
    const video = allVideos.find((r) => r.videoId === videoId) ?? null;
    setSelectedVideo(video);
    setScreen("player");
    setSeenVideoIds((prev) => {
      const next = new Set(prev);
      next.add(videoId);
      persistSeenVideos(next);
      return next;
    });
  }

  function handleBackFromResults() {
    setResults([]);
    setChannelData(null);
    setQuery("");
    setScreen("search");
  }

  function handleBackFromPlayer() {
    if (channelData) {
      setScreen("channel-results");
    } else {
      setScreen("results");
    }
  }

  async function handleChannelSelectFromSubscriptions(channel: ChannelResult) {
    const config = getConfig();
    try {
      const allResults = await getChannelLatestVideos(channel.channelId, config.youtubeApiKey, channel.thumbnailUrl);
      const titles = allResults.map((r) => r.title);
      const classified = await classifyClickbait(titles);
      const clickbaitMap = new Map(classified.map((item) => [item.title, item.clickbait]));
      const latestVideos = allResults.map((r) => ({ ...r, isClickbait: clickbaitMap.get(r.title) ?? false }));
      setChannelData({ channel, latestVideos });
      setQuery(channel.title);
      setScreen("channel-results");
    } catch {
      // If fetch fails, stay on subscriptions screen
    }
  }

  const { dailyLimitSeconds, weeklyLimitSeconds } = getConfig();
  const isLocked = todaySeconds >= dailyLimitSeconds || weekSeconds >= weeklyLimitSeconds;

  if (!ready) {
    return <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }} />;
  }

  const modelBanner = modelStatus !== "ready" && (
    <div style={{ position: "fixed", bottom: 12, right: 12, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 12px", fontSize: 12, color: modelStatus === "error" ? "var(--text-warn, #f59e0b)" : "var(--text-dim)", zIndex: 9999 }}>
      {modelStatus === "error" ? "AI model failed to start" : "Starting AI model\u2026"}
    </div>
  );

  const shellValue = { todaySeconds, weekSeconds, dailyLimitSeconds, weeklyLimitSeconds, isLocked, onSettings: () => setScreen("setup") };

  if (screen === "setup") {
    const wasConfigured = isConfigured();
    return (
      <WatchLimitProvider value={shellValue}>
        <div className="app">
          <SetupScreen
            onSave={() => setScreen("search")}
            onBack={wasConfigured ? () => setScreen("search") : undefined}
          />
        </div>
        {modelBanner}
      </WatchLimitProvider>
    );
  }

  if (screen === "search") {
    return (
      <WatchLimitProvider value={shellValue}>
        <div className="app">
          <SearchScreen
            onSearch={handleSearch}
            onChannelSearch={handleChannelSearch}
            onSubscriptions={() => setScreen("subscriptions")}
          />
        </div>
        {modelBanner}
      </WatchLimitProvider>
    );
  }

  if (screen === "results") {
    return (
      <WatchLimitProvider value={shellValue}>
        <ResultsList
          results={results}
          query={query}
          onSelect={handleSelect}
          onBack={handleBackFromResults}
          seenVideoIds={seenVideoIds}
        />
        {modelBanner}
      </WatchLimitProvider>
    );
  }

  if (screen === "channel-results" && channelData) {
    return (
      <WatchLimitProvider value={shellValue}>
        <ChannelResultsScreen
          data={channelData}
          query={query}
          onSelect={handleSelect}
          onBack={handleBackFromResults}
          seenVideoIds={seenVideoIds}
        />
        {modelBanner}
      </WatchLimitProvider>
    );
  }

  async function handleGoToChannelFromPlayer() {
    if (!selectedVideo?.channelId) return;
    const channel: ChannelResult = {
      channelId: selectedVideo.channelId,
      title: selectedVideo.channelTitle,
      thumbnailUrl: selectedVideo.channelThumbnailUrl ?? "",
      description: "",
    };
    await handleChannelSelectFromSubscriptions(channel);
  }

  if (screen === "player" && selectedVideo) {
    return (
      <WatchLimitProvider value={shellValue}>
        <PlayerScreen
          video={selectedVideo}
          onBack={handleBackFromPlayer}
          onGoToChannel={selectedVideo.channelId ? handleGoToChannelFromPlayer : undefined}
        />
        {modelBanner}
      </WatchLimitProvider>
    );
  }

  if (screen === "subscriptions") {
    return (
      <WatchLimitProvider value={shellValue}>
        <div className="app">
          <SubscriptionsScreen
            onBack={() => setScreen("search")}
            onChannelSelect={handleChannelSelectFromSubscriptions}
          />
        </div>
        {modelBanner}
      </WatchLimitProvider>
    );
  }

  return null;
}
