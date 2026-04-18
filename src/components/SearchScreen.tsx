import { useState, useRef, useEffect } from "react";
import { VideoResult } from "../types";
import { getConfig } from "../services/config";
import { rephraseQuery, filterClickbait } from "../services/lmStudio";
import { searchYouTube } from "../services/youtube";
import Logo from "./Logo";

interface SearchScreenProps {
  onSearch(results: VideoResult[], query: string): void;
}

type Phase = "idle" | "thinking";

function Spinner() {
  return (
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        border: "2px solid var(--border-strong)",
        borderTopColor: "var(--accent)",
        animation: "spin 0.7s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <path d="M2.5 7l3.5 3.5 5.5-6" stroke="var(--success)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ color: active ? "var(--accent)" : "var(--text-mute)", transition: "color 0.2s" }}>
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function SearchScreen({ onSearch }: SearchScreenProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [inputValue, setInputValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Thinking state
  const [row1Visible, setRow1Visible] = useState(false);
  const [row2Visible, setRow2Visible] = useState(false);
  const [row3Visible, setRow3Visible] = useState(false);
  const [originalQuery, setOriginalQuery] = useState("");
  const [rephrasedText, setRephrasedText] = useState("");
  const [typewriterDone, setTypewriterDone] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query) return;

    setError(null);
    setPhase("thinking");
    setOriginalQuery(query);
    setRephrasedText("");
    setTypewriterDone(false);
    setRow1Visible(false);
    setRow2Visible(false);
    setRow3Visible(false);

    setTimeout(() => setRow1Visible(true), 0);
    setTimeout(() => setRow2Visible(true), 450);
    setTimeout(() => setRow3Visible(true), 1100);

    const config = getConfig();
    let rephrased = query;
    let results: VideoResult[] = [];

    try {
      rephrased = await rephraseQuery(query, config.lmStudioUrl);
    } catch {
      // fallback to original query — handled in rephraseQuery already
    }

    // Start typewriter after rephrase resolves
    startTypewriter(rephrased);

    try {
      const allResults = await searchYouTube(rephrased, config.youtubeApiKey);
      const titles = allResults.map((r) => r.title);
      const cleanTitles = await filterClickbait(titles, config.lmStudioUrl);
      const cleanSet = new Set(cleanTitles);
      results = allResults.filter((r) => cleanSet.has(r.title)).slice(0, 3);

      if (results.length === 0) {
        setTimeout(() => {
          setPhase("idle");
          setError("No results found. Try a different search.");
        }, 2200);
        return;
      }
    } catch (err: any) {
      const msg = err?.message ?? "";
      setTimeout(() => {
        setPhase("idle");
        if (msg.includes("LM Studio") || msg.includes("localhost")) {
          setError("Cannot reach LM Studio. Make sure it's running.");
        } else {
          setError("YouTube search failed. Check your API key.");
        }
      }, 2200);
      return;
    }

    setTimeout(() => {
      onSearch(results, query);
    }, 2200);
  }

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

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "var(--bg-elev)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "14px 18px",
    animation: "rowIn 0.5s var(--ease) forwards",
    opacity: 0,
  };

  const labelStyle: React.CSSProperties = {
    color: "var(--text-mute)",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    minWidth: 78,
    flexShrink: 0,
  };

  if (phase === "thinking") {
    return (
      <div className="app__main">
        <div style={{ width: "100%", maxWidth: 620, display: "flex", flexDirection: "column", gap: 10 }}>
          {row1Visible && (
            <div style={{ ...rowStyle, animationDelay: "0s" }}>
              <span style={labelStyle}>You</span>
              <span style={{ color: "var(--text)", flex: 1 }}>{originalQuery}</span>
              <CheckIcon />
            </div>
          )}
          {row2Visible && (
            <div style={{ ...rowStyle, animationDelay: "0s" }}>
              <span style={labelStyle}>Rephrase</span>
              <span style={{ color: "var(--text)", flex: 1, fontFamily: "var(--font-mono)", fontSize: 14 }}>
                {rephrasedText}
                {!typewriterDone && (
                  <span style={{ animation: "blink 1s steps(2) infinite", display: "inline-block" }}>▌</span>
                )}
              </span>
              {typewriterDone ? <CheckIcon /> : <Spinner />}
            </div>
          )}
          {row3Visible && (
            <div style={{ ...rowStyle, animationDelay: "0s" }}>
              <span style={labelStyle}>Search</span>
              <span style={{ color: "var(--text-dim)", flex: 1 }}>Querying YouTube · filtering clickbait…</span>
              <Spinner />
            </div>
          )}
          {error && (
            <p style={{ color: "var(--accent)", fontSize: 13, marginTop: 8, textAlign: "center" }}>{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app__main">
      <div style={{ width: "100%", maxWidth: 620, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        <div style={{ marginBottom: 44 }}>
          <Logo size="xl" />
        </div>
        <form onSubmit={handleSubmit} style={{ width: "100%" }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
          <div style={{ position: "relative", width: "100%" }}>
            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex" }}>
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
                borderRadius: 12,
                color: "var(--text)",
                fontSize: 16,
                fontFamily: "var(--font-sans)",
                outline: "none",
                boxShadow: focused ? "0 0 0 3px var(--accent-ring)" : "none",
                transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
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
        {error && (
          <p style={{ color: "var(--accent)", fontSize: 13, marginTop: 12, textAlign: "center" }}>{error}</p>
        )}
        <p style={{ marginTop: 14, fontSize: 12, color: "var(--text-mute)", fontFamily: "var(--font-mono)" }}>
          AI rephrases your query · filters clickbait · max 3 results
        </p>
      </div>
    </div>
  );
}
