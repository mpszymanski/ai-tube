import { useState, useEffect } from "react";
import { AppScreen, VideoResult, ChannelResultWithVideos } from "./types";
import { isConfigured } from "./services/config";
import { getTodaySeconds, getWeekSeconds } from "./services/watchTime";
import SetupScreen from "./components/SetupScreen";
import SearchScreen from "./components/SearchScreen";
import ResultsList from "./components/ResultsList";
import PlayerScreen from "./components/PlayerScreen";
import ChannelResultsScreen from "./components/ChannelResultsScreen";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>(() =>
    isConfigured() ? "search" : "setup"
  );
  const [results, setResults] = useState<VideoResult[]>([]);
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
    setQuery(searchQuery);
    setScreen("results");
  }

  function handleChannelSearch(data: ChannelResultWithVideos, searchQuery: string) {
    setChannelData(data);
    setQuery(searchQuery);
    setScreen("channel-results");
  }

  function handleSelect(videoId: string) {
    const allVideos = screen === "channel-results" && channelData
      ? channelData.latestVideos
      : results;
    const video = allVideos.find((r) => r.videoId === videoId) ?? null;
    setSelectedVideo(video);
    setScreen("player");
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
          onChannelSearch={handleChannelSearch}
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

  return null;
}
