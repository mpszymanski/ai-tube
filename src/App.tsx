import { useState, useEffect } from "react";
import { AppScreen, VideoResult } from "./types";
import { isConfigured } from "./services/config";
import { getTodaySeconds, getWeekSeconds } from "./services/watchTime";
import SetupScreen from "./components/SetupScreen";
import SearchScreen from "./components/SearchScreen";
import ResultsList from "./components/ResultsList";
import PlayerScreen from "./components/PlayerScreen";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>(() =>
    isConfigured() ? "search" : "setup"
  );
  const [results, setResults] = useState<VideoResult[]>([]);
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

  function handleSelect(videoId: string) {
    const video = results.find((r) => r.videoId === videoId) ?? null;
    setSelectedVideo(video);
    setScreen("player");
  }

  function handleBackFromResults() {
    setResults([]);
    setQuery("");
    setScreen("search");
  }

  function handleBackFromPlayer() {
    setScreen("results");
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
        <SearchScreen onSearch={handleSearch} todaySeconds={todaySeconds} weekSeconds={weekSeconds} />
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
