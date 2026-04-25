import { useState, useEffect, useMemo } from "react";
import { AppScreen, VideoResult, ChannelResult, ChannelResultWithVideos, MODEL_STATUS, ModelStatus } from "./types";
import { isConfigured, getConfig } from "./services/config";
import { getTodaySeconds, getWeekSeconds, isCacheReady, hydrate as hydrateWatchTime } from "./services/watchTime";
import { hydrateSeenVideos, persistSeenVideos } from "./services/seenVideos";
import { runChannelSearch } from "./services/searchService";
import { bootstrapStorage } from "./services";
import { ensureModelServer } from "./services/modelServer";
import { checkModelExists, downloadModel, type DownloadProgress } from "./services/modelDownloader";
import { invoke } from "@tauri-apps/api/core";
import { WatchLimitProvider } from "./context/WatchLimitContext";
import SetupScreen from "./components/screens/SetupScreen";
import SearchScreen from "./components/screens/SearchScreen";
import ResultsList from "./components/screens/ResultsList";
import PlayerScreen from "./components/screens/PlayerScreen";
import ChannelResultsScreen from "./components/screens/ChannelResultsScreen";
import SubscriptionsScreen from "./components/screens/SubscriptionsScreen";

export default function App() {
  const [ready, setReady] = useState(false);
  const [modelStatus, setModelStatus] = useState<ModelStatus>(MODEL_STATUS.CHECKING);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

  async function runModelPipeline(forceDownload: boolean) {
    const exists = await checkModelExists();
    if (!exists || forceDownload) {
      setModelStatus(MODEL_STATUS.DOWNLOADING);
      await downloadModel(setDownloadProgress);
    }
    setModelStatus(MODEL_STATUS.STARTING);
    await ensureModelServer();
    setModelStatus(MODEL_STATUS.READY);
  }

  async function retryModelDownload() {
    try { await invoke("stop_model_server"); } catch {}
    setDownloadProgress(null);
    try {
      await runModelPipeline(true);
    } catch (e) {
      console.error("[retry] model pipeline failed:", e);
      setModelStatus(MODEL_STATUS.ERROR);
    }
  }

  useEffect(() => {
    bootstrapStorage().then(() => setReady(true));

    (async () => {
      try {
        const info = await invoke("get_debug_info");
        console.log("[boot] debug info:", info);
        await runModelPipeline(false);
      } catch (e) {
        console.error("[boot] model pipeline failed:", e);
        setModelStatus(MODEL_STATUS.ERROR);
      }
    })();
  }, []);

  const [screen, setScreen] = useState<AppScreen>("search");
  const [previousScreen, setPreviousScreen] = useState<AppScreen>("results");
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
    const id = setInterval(async () => {
      if (!isCacheReady()) await hydrateWatchTime();
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
    setPreviousScreen(screen);
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
    setScreen(previousScreen);
  }

  async function handleChannelSelectFromSubscriptions(channel: ChannelResult) {
    const config = getConfig();
    try {
      const result = await runChannelSearch({ channel, apiKey: config.youtubeApiKey });
      setChannelData(result);
      setQuery(channel.title);
      setScreen("channel-results");
    } catch {
      // If fetch fails, stay on subscriptions screen
    }
  }

  const { dailyLimitSeconds, weeklyLimitSeconds } = getConfig();
  const isLocked = todaySeconds >= dailyLimitSeconds || weekSeconds >= weeklyLimitSeconds;

  const shellValue = useMemo(
    () => ({ todaySeconds, weekSeconds, dailyLimitSeconds, weeklyLimitSeconds, isLocked, onSettings: () => setScreen("setup") }),
    [todaySeconds, weekSeconds, dailyLimitSeconds, weeklyLimitSeconds, isLocked],
  );

  if (!ready) {
    return <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }} />;
  }

  const modelBanner = modelStatus !== MODEL_STATUS.READY && (
    <div style={{ position: "fixed", bottom: 12, right: 12, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 14px", fontSize: 12, color: modelStatus === MODEL_STATUS.ERROR ? "var(--text-warn, #f59e0b)" : "var(--text-dim)", zIndex: 9999, minWidth: 220 }}>
      {modelStatus === MODEL_STATUS.ERROR && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>AI model failed to start</span>
          <button
            onClick={retryModelDownload}
            style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 4, padding: "4px 10px", fontSize: 11, cursor: "pointer", alignSelf: "flex-start" }}
          >
            Re-download model
          </button>
        </div>
      )}
      {modelStatus === MODEL_STATUS.CHECKING && "Checking AI model…"}
      {modelStatus === MODEL_STATUS.STARTING && "Starting AI model…"}
      {modelStatus === MODEL_STATUS.DOWNLOADING && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Downloading AI model…</span>
          {downloadProgress && (
            <>
              <div style={{ background: "var(--border)", borderRadius: 3, height: 4, overflow: "hidden" }}>
                <div style={{ background: "var(--accent)", height: "100%", width: `${Math.round((downloadProgress.downloaded / downloadProgress.total) * 100)}%`, transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: 11 }}>
                {(downloadProgress.downloaded / 1e9).toFixed(2)} / {(downloadProgress.total / 1e9).toFixed(2)} GB
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );

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
