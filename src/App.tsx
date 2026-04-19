import { useState, useEffect } from "react";
import { AppScreen, VideoResult, ChannelResult, ChannelResultWithVideos, TopicGroup } from "./types";
import { hydrate as hydrateConfig, isConfigured, getConfig } from "./services/config";
import { hydrate as hydrateWatchTime, getTodaySeconds, getWeekSeconds } from "./services/watchTime";
import { hydrate as hydrateTaggedChannels } from "./services/taggedChannels";
import { hydrate as hydrateApiUsage } from "./services/apiUsage";
import { getChannelLatestVideos } from "./services/youtube";
import { classifyClickbait } from "./services/lmStudio";
import { WatchLimitProvider } from "./context/WatchLimitContext";
import SetupScreen from "./components/screens/SetupScreen";
import SearchScreen from "./components/screens/SearchScreen";
import ResultsList from "./components/screens/ResultsList";
import GroupedResultsList from "./components/screens/GroupedResultsList";
import PlayerScreen from "./components/screens/PlayerScreen";
import ChannelResultsScreen from "./components/screens/ChannelResultsScreen";
import SubscriptionsScreen from "./components/screens/SubscriptionsScreen";

async function bootstrapStorage(): Promise<void> {
  await Promise.all([
    hydrateConfig(),
    hydrateWatchTime(),
    hydrateTaggedChannels(),
    hydrateApiUsage(),
  ]);
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    bootstrapStorage().then(() => setReady(true));
  }, []);

  const [screen, setScreen] = useState<AppScreen>("search");
  const [results, setResults] = useState<VideoResult[]>([]);
  const [groupedResults, setGroupedResults] = useState<TopicGroup[]>([]);
  const [channelData, setChannelData] = useState<ChannelResultWithVideos | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoResult | null>(null);
  const [query, setQuery] = useState("");
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [weekSeconds, setWeekSeconds] = useState(0);

  useEffect(() => {
    if (!ready) return;
    setScreen(isConfigured() ? "search" : "setup");
    setTodaySeconds(getTodaySeconds());
    setWeekSeconds(getWeekSeconds());
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
    setGroupedResults([]);
    setQuery(searchQuery);
    setScreen("results");
  }

  function handleGroupedSearch(groups: TopicGroup[], searchQuery: string) {
    setGroupedResults(groups);
    setResults([]);
    setQuery(searchQuery);
    setScreen("grouped-results");
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
        : screen === "grouped-results"
        ? groupedResults.flatMap((g) => g.videos)
        : results;
    const video = allVideos.find((r) => r.videoId === videoId) ?? null;
    setSelectedVideo(video);
    setScreen("player");
  }

  function handleBackFromResults() {
    setResults([]);
    setGroupedResults([]);
    setChannelData(null);
    setQuery("");
    setScreen("search");
  }

  function handleBackFromPlayer() {
    if (channelData) {
      setScreen("channel-results");
    } else if (groupedResults.length > 0) {
      setScreen("grouped-results");
    } else {
      setScreen("results");
    }
  }

  async function handleChannelSelectFromSubscriptions(channel: ChannelResult) {
    const config = getConfig();
    try {
      const allResults = await getChannelLatestVideos(channel.channelId, config.youtubeApiKey, channel.thumbnailUrl);
      const titles = allResults.map((r) => r.title);
      const classified = await classifyClickbait(titles, config.lmStudioUrl);
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
      </WatchLimitProvider>
    );
  }

  if (screen === "search") {
    return (
      <WatchLimitProvider value={shellValue}>
        <div className="app">
          <SearchScreen
            onSearch={handleSearch}
            onGroupedSearch={handleGroupedSearch}
            onChannelSearch={handleChannelSearch}
            onSubscriptions={() => setScreen("subscriptions")}
          />
        </div>
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
        />
      </WatchLimitProvider>
    );
  }

  if (screen === "grouped-results") {
    return (
      <WatchLimitProvider value={shellValue}>
        <GroupedResultsList
          groups={groupedResults}
          query={query}
          onSelect={handleSelect}
          onBack={handleBackFromResults}
        />
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
        />
      </WatchLimitProvider>
    );
  }

  if (screen === "player" && selectedVideo) {
    return (
      <WatchLimitProvider value={shellValue}>
        <PlayerScreen
          video={selectedVideo}
          onBack={handleBackFromPlayer}
        />
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
      </WatchLimitProvider>
    );
  }

  return null;
}
