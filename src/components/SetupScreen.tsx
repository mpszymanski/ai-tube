import { useState } from "react";
import { getConfig, saveConfig } from "../services/config";

interface SetupScreenProps {
  onSave(): void;
  onBack?(): void;
}

export default function SetupScreen({ onSave, onBack }: SetupScreenProps) {
  const config = getConfig();
  const [apiKey, setApiKey] = useState(config.youtubeApiKey);
  const [lmUrl, setLmUrl] = useState(config.lmStudioUrl);
  const [apiKeyTouched, setApiKeyTouched] = useState(false);

  const apiKeyInvalid = apiKeyTouched && apiKey.length > 0 && apiKey.length < 20;
  const canSave = apiKey.trim().length >= 20;

  function handleSave() {
    if (!canSave) return;
    saveConfig({ youtubeApiKey: apiKey.trim(), lmStudioUrl: lmUrl.trim() || "http://localhost:1234" });
    onSave();
  }

  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: "var(--bg-elev)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text)",
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  return (
    <div className="app__main" style={{ justifyContent: "center" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: 32,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Key icon */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="11" cy="11" r="6" stroke="var(--text-dim)" strokeWidth="2" />
              <path d="M16 16l8 8" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" />
              <path d="M21 19l2 2" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text)" }}>
              Welcome to AI Tube
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 4 }}>Two things and we're done.</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* YouTube API Key */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-dim)" }}>YouTube API Key</label>
            <input
              type="text"
              placeholder="AIzaSy…"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onBlur={() => setApiKeyTouched(true)}
              style={{
                ...inputBase,
                borderColor: apiKeyInvalid ? "var(--accent)" : "var(--border)",
                boxShadow: apiKeyInvalid ? "0 0 0 3px var(--accent-ring)" : "none",
              }}
            />
            {apiKeyInvalid ? (
              <span style={{ fontSize: 11, color: "var(--accent)" }}>API key must be at least 20 characters</span>
            ) : (
              <span style={{ fontSize: 11, color: "var(--text-mute)" }}>
                Get a free key at console.cloud.google.com
              </span>
            )}
          </div>

          {/* LM Studio URL */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-dim)" }}>LM Studio URL</label>
            <input
              type="text"
              value={lmUrl}
              onChange={(e) => setLmUrl(e.target.value)}
              style={inputBase}
            />
            <span style={{ fontSize: 11, color: "var(--text-mute)" }}>
              Your local model endpoint — used to rephrase queries.
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                flex: 1,
                padding: "11px 20px",
                background: "transparent",
                color: "var(--text-dim)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elev)"; e.currentTarget.style.color = "var(--text)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-dim)"; }}
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              flex: 1,
              padding: "11px 20px",
              background: canSave ? "var(--accent)" : "var(--border-strong)",
              color: canSave ? "#fff" : "var(--text-mute)",
              border: "none",
              borderRadius: "var(--radius)",
              fontSize: 14,
              fontWeight: 500,
              cursor: canSave ? "pointer" : "not-allowed",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { if (canSave) e.currentTarget.style.background = "var(--accent-dim)"; }}
            onMouseLeave={(e) => { if (canSave) e.currentTarget.style.background = "var(--accent)"; }}
          >
            Save &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
}
