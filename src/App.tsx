import { useState, useEffect } from "react";
import { AppScreen, VideoResult, ChannelResult, ChannelResultWithVideos, TopicGroup } from "./types";
import { isConfigured, getConfig } from "./services/config";
import { getTodaySeconds, getWeekSeconds } from "./services/watchTime";
import { getChannelLatestVideos } from "./services/youtube";
import { classifyClickbait } from "./services/lmStudio";
import SetupScreen from "./components/SetupScreen";
import SearchScreen from "./components/SearchScreen";
import ResultsList from "./components/ResultsList";
import GroupedResultsList from "./components/GroupedResultsList";
import PlayerScreen from "./components/PlayerScreen";
import ChannelResultsScreen from "./components/ChannelResultsScreen";
import SubscriptionsScreen from "./components/SubscriptionsScreen";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>(() =>
    isConfigured() ? "search" : "setup"
  );
  const [results, setResults] = useState<VideoResult[]>([]);
  const [groupedResults, setGroupedResults] = useState<TopicGroup[]>([]);
  const [channelData, setChannelData] = useState<ChannelResultWithVideos | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoResult | null>(null);
  const [query, setQuery] = useState("");
  const [todaySeconds, setTodaySeconds] = useState(() => getTodaySeconds());
  const [weekSeconds, setWeekSeconds] = useState(() => getWeekSeconds());

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

  if (screen === "setup") {
    return (
      <div className="app">
        <SetupScreen onSave={() => setScreen("search")} />
      </div>
    );
  }

  if (screen === "search") {
    return (
      <div className="app">
        <SearchScreen
          onSearch={handleSearch}
          onGroupedSearch={handleGroupedSearch}
          onChannelSearch={handleChannelSearch}
          onSubscriptions={() => setScreen("subscriptions")}
          todaySeconds={todaySeconds}
          weekSeconds={weekSeconds}
        />
      </div>
    );
  }

  if (screen === "results") {
    return (
      <ResultsList
        results={results}
        query={query}
        todaySeconds={todaySeconds}
        weekSeconds={weekSeconds}
        onSelect={handleSelect}
        onBack={handleBackFromResults}
      />
    );
  }

  if (screen === "grouped-results") {
    return (
      <GroupedResultsList
        groups={groupedResults}
        query={query}
        todaySeconds={todaySeconds}
        weekSeconds={weekSeconds}
        onSelect={handleSelect}
        onBack={handleBackFromResults}
      />
    );
  }

  if (screen === "channel-results" && channelData) {
    return (
      <ChannelResultsScreen
        data={channelData}
        query={query}
        todaySeconds={todaySeconds}
        weekSeconds={weekSeconds}
        onSelect={handleSelect}
        onBack={handleBackFromResults}
      />
    );
  }

  if (screen === "player" && selectedVideo) {
    return (
      <PlayerScreen
        video={selectedVideo}
        todaySeconds={todaySeconds}
        weekSeconds={weekSeconds}
        onBack={handleBackFromPlayer}
      />
    );
  }

  if (screen === "subscriptions") {
    return (
      <div className="app">
        <SubscriptionsScreen
          todaySeconds={todaySeconds}
          weekSeconds={weekSeconds}
          onBack={() => setScreen("search")}
          onChannelSelect={handleChannelSelectFromSubscriptions}
        />
      </div>
    );
  }

  return null;
}
