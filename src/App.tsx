import { useState, useEffect, useRef, useMemo } from "react";
import {
  VideoResult,
  ChannelResult,
  ChannelResultWithVideos,
  MODEL_STATUS,
  ModelStatus,
  ScreenState,
} from "./types";
import { isConfigured, getConfig } from "./services/config";
import {
  getTodaySeconds,
  getWeekSeconds,
  isCacheReady,
  hydrate as hydrateWatchTime,
} from "./services/watchTime";
import { hydrateSeenVideos, persistSeenVideos } from "./services/seenVideos";
import { runChannelSearch } from "./services/searchService";
import { bootstrapStorage } from "./services";
import { ensureModelServer } from "./services/modelServer";
import {
  checkModelExists,
  downloadModel,
  type DownloadProgress,
} from "./services/modelDownloader";
import { checkForUpdates } from "./services/version";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { WatchLimitProvider } from "./context/WatchLimitContext";
import { log } from "./services/logger";
import Banner from "./components/ui/Banner";
import BannerStack from "./components/ui/BannerStack";
import SetupScreen from "./components/screens/SetupScreen";
import SearchScreen from "./components/screens/SearchScreen";
import ResultsList from "./components/screens/ResultsList";
import PlayerScreen from "./components/screens/PlayerScreen";
import ChannelResultsScreen from "./components/screens/ChannelResultsScreen";
import SubscriptionsScreen from "./components/screens/SubscriptionsScreen";
import Button from "./components/ui/Button";

export default function App() {
  const [ready, setReady] = useState(false);
  const [modelStatus, setModelStatus] = useState<ModelStatus>(
    MODEL_STATUS.CHECKING,
  );
  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgress | null>(null);
  const [updateInfo, setUpdateInfo] = useState<{
    latestVersion: string;
    releaseUrl: string;
  } | null>(null);

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
    try {
      await invoke("stop_model_server");
    } catch {}
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
      checkForUpdates().then((info) => {
        if (info) setUpdateInfo(info);
      });
    })();
  }, []);

  const [screenState, setScreenState] = useState<ScreenState>({
    kind: "search",
  });
  const screenStateRef = useRef<ScreenState>({ kind: "search" });

  function navigate(state: ScreenState): void {
    log("user", "navigate", {
      from: screenStateRef.current.kind,
      to: state.kind,
    });
    screenStateRef.current = state;
    setScreenState(state);
  }

  const [todaySeconds, setTodaySeconds] = useState(0);
  const [weekSeconds, setWeekSeconds] = useState(0);
  const [seenVideoIds, setSeenVideoIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!ready) return;
    navigate(isConfigured() ? { kind: "search" } : { kind: "setup" });
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
    log("user", "search_results", {
      query: searchQuery,
      count: newResults.length,
    });
    navigate({ kind: "results", results: newResults, query: searchQuery });
  }

  function handleChannelSearch(
    data: ChannelResultWithVideos,
    searchQuery: string,
  ) {
    log("user", "channel_results", {
      query: searchQuery,
      channelId: data.channel.channelId,
      count: data.latestVideos.length,
    });
    navigate({ kind: "channel-results", data, query: searchQuery });
  }

  function handleSelect(videoId: string) {
    const s = screenStateRef.current;
    if (s.kind !== "results" && s.kind !== "channel-results") return;
    const allVideos =
      s.kind === "channel-results" ? s.data.latestVideos : s.results;
    const video = allVideos.find((r) => r.videoId === videoId);
    if (!video) return;
    log("user", "video_opened", {
      videoId,
      title: video.title,
      channelTitle: video.channelTitle,
    });
    navigate({ kind: "player", video, prevState: s });
    setSeenVideoIds((prev) => {
      const next = new Set(prev);
      next.add(videoId);
      persistSeenVideos(next);
      return next;
    });
  }

  function handleBackFromPlayer() {
    const s = screenStateRef.current;
    if (s.kind !== "player") return;
    navigate(s.prevState);
  }

  async function handleChannelSelectFromSubscriptions(channel: ChannelResult) {
    const config = getConfig();
    try {
      const result = await runChannelSearch({
        channel,
        apiKey: config.youtubeApiKey,
      });
      navigate({ kind: "channel-results", data: result, query: channel.title });
    } catch {
      // If fetch fails, stay on subscriptions screen
    }
  }

  async function handleGoToChannelFromPlayer() {
    const s = screenStateRef.current;
    if (s.kind !== "player" || !s.video.channelId) return;
    const channel: ChannelResult = {
      channelId: s.video.channelId,
      title: s.video.channelTitle,
      thumbnailUrl: s.video.channelThumbnailUrl ?? "",
      description: "",
    };
    await handleChannelSelectFromSubscriptions(channel);
  }

  const { dailyLimitSeconds, weeklyLimitSeconds } = getConfig();
  const isLocked =
    todaySeconds >= dailyLimitSeconds || weekSeconds >= weeklyLimitSeconds;

  const wasLockedRef = useRef(false);
  useEffect(() => {
    if (isLocked && !wasLockedRef.current) {
      log("time", "watch_limit_reached", {
        todaySeconds,
        weekSeconds,
        dailyLimitSeconds,
        weeklyLimitSeconds,
      });
    }
    wasLockedRef.current = isLocked;
  }, [
    isLocked,
    todaySeconds,
    weekSeconds,
    dailyLimitSeconds,
    weeklyLimitSeconds,
  ]);

  const shellValue = useMemo(
    () => ({
      todaySeconds,
      weekSeconds,
      dailyLimitSeconds,
      weeklyLimitSeconds,
      isLocked,
      onSettings: () => navigate({ kind: "setup" }),
    }),
    [
      todaySeconds,
      weekSeconds,
      dailyLimitSeconds,
      weeklyLimitSeconds,
      isLocked,
    ],
  );

  if (!ready) {
    return (
      <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }} />
    );
  }

  const modelBanner = modelStatus !== MODEL_STATUS.READY && (
    <Banner
      color={
        modelStatus === MODEL_STATUS.ERROR
          ? "var(--text-warn, #f59e0b)"
          : "var(--text-dim)"
      }
    >
      {modelStatus === MODEL_STATUS.ERROR && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>AI model failed to start</span>
          <button
            onClick={retryModelDownload}
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "4px 10px",
              fontSize: 11,
              cursor: "pointer",
              alignSelf: "flex-start",
            }}
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
              <div
                style={{
                  background: "var(--border)",
                  borderRadius: 3,
                  height: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    background: "var(--accent)",
                    height: "100%",
                    width: `${Math.round((downloadProgress.downloaded / downloadProgress.total) * 100)}%`,
                    transition: "width 0.3s",
                  }}
                />
              </div>
              <span style={{ fontSize: 11 }}>
                {(downloadProgress.downloaded / 1e9).toFixed(2)} /{" "}
                {(downloadProgress.total / 1e9).toFixed(2)} GB
              </span>
            </>
          )}
        </div>
      )}
    </Banner>
  );

  const updateBanner = updateInfo && (
    <Banner>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span>
          <span style={{ color: "#fff" }}>v{updateInfo.latestVersion}</span> is
          now available!
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button
            style={{ flex: 1 }}
            variant="primary"
            onClick={() => openUrl(updateInfo.releaseUrl)}
          >
            Download
          </Button>
          <Button onClick={() => setUpdateInfo(null)}>Skip</Button>
        </div>
      </div>
    </Banner>
  );

  const s = screenState;
  let content: React.ReactNode = null;

  if (s.kind === "setup") {
    const wasConfigured = isConfigured();
    content = (
      <div className="app">
        <SetupScreen
          onSave={() => navigate({ kind: "search" })}
          onBack={
            wasConfigured ? () => navigate({ kind: "search" }) : undefined
          }
        />
      </div>
    );
  } else if (s.kind === "search") {
    content = (
      <div className="app">
        <SearchScreen
          onSearch={handleSearch}
          onChannelSearch={handleChannelSearch}
          onSubscriptions={() => navigate({ kind: "subscriptions" })}
        />
      </div>
    );
  } else if (s.kind === "results") {
    content = (
      <ResultsList
        results={s.results}
        query={s.query}
        onSelect={handleSelect}
        onBack={() => navigate({ kind: "search" })}
        seenVideoIds={seenVideoIds}
      />
    );
  } else if (s.kind === "channel-results") {
    content = (
      <ChannelResultsScreen
        data={s.data}
        query={s.query}
        onSelect={handleSelect}
        onBack={() => navigate({ kind: "search" })}
        seenVideoIds={seenVideoIds}
      />
    );
  } else if (s.kind === "player") {
    content = (
      <PlayerScreen
        video={s.video}
        onBack={handleBackFromPlayer}
        onGoToChannel={
          s.video.channelId ? handleGoToChannelFromPlayer : undefined
        }
      />
    );
  } else if (s.kind === "subscriptions") {
    content = (
      <div className="app">
        <SubscriptionsScreen
          onBack={() => navigate({ kind: "search" })}
          onChannelSelect={handleChannelSelectFromSubscriptions}
        />
      </div>
    );
  }

  return (
    <WatchLimitProvider value={shellValue}>
      {content}
      {(modelBanner || updateBanner) && (
        <BannerStack>
          {modelBanner}
          {updateBanner}
        </BannerStack>
      )}
    </WatchLimitProvider>
  );
}
