import { useState } from "react";
import { CogIcon } from "../ui/Icons";
import Button from "../ui/Button";
import { getConfig, saveConfig } from "../../services/config";
import { useWatchLimit } from "../../context/WatchLimitContext";

interface SetupScreenProps {
  onSave(): void;
  onBack?(): void;
}

export default function SetupScreen({ onSave, onBack }: SetupScreenProps) {
  const { isLocked } = useWatchLimit();
  const config = getConfig();
  const [apiKey, setApiKey] = useState(config.youtubeApiKey);
  const [dailyMinutes, setDailyMinutes] = useState(Math.round(config.dailyLimitSeconds / 60));
  const [weeklyMinutes, setWeeklyMinutes] = useState(Math.round(config.weeklyLimitSeconds / 60));
  const [apiKeyTouched, setApiKeyTouched] = useState(false);

  const apiKeyInvalid = apiKeyTouched && apiKey.length > 0 && apiKey.length < 20;
  const canSave = apiKey.trim().length >= 20;

  function handleSave() {
    if (!canSave) return;
    saveConfig({
      youtubeApiKey: apiKey.trim(),
      dailyLimitSeconds: Math.max(1, dailyMinutes) * 60,
      weeklyLimitSeconds: Math.max(1, weeklyMinutes) * 60,
    });
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

  const limitInputStyle: React.CSSProperties = {
    ...inputBase,
    opacity: isLocked ? 0.5 : 1,
    cursor: isLocked ? "not-allowed" : undefined,
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
            <CogIcon size={28} color="var(--text-dim)" />
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

          {/* Usage Limits */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-dim)" }}>Usage Limits</label>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "var(--text-mute)" }}>Daily (minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={dailyMinutes}
                  onChange={(e) => setDailyMinutes(Number(e.target.value))}
                  disabled={!!isLocked}
                  style={limitInputStyle}
                />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "var(--text-mute)" }}>Weekly (minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={weeklyMinutes}
                  onChange={(e) => setWeeklyMinutes(Number(e.target.value))}
                  disabled={!!isLocked}
                  style={limitInputStyle}
                />
              </div>
            </div>
            {isLocked ? (
              <span style={{ fontSize: 11, color: "var(--accent)" }}>
                Limit reached — limits cannot be changed while locked.
              </span>
            ) : (
              <span style={{ fontSize: 11, color: "var(--text-mute)" }}>
                Resets daily at midnight · Weekly resets every Monday.
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {onBack && (
            <Button variant="secondary" size="md" onClick={onBack} style={{ flex: 1 }}>
              Cancel
            </Button>
          )}
          <Button variant="primary" size="md" disabled={!canSave} onClick={handleSave} style={{ flex: 1 }}>
            Save &amp; Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
