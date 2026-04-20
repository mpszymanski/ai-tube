import Logo from "../ui/Logo";
import { ChannelResult } from "../../types";

interface ApiUsage {
  used: number;
  max: number;
}

interface SearchIdleViewProps {
  subscribedChannels: ChannelResult[];
  isLocked: boolean;
  apiUsage: ApiUsage;
  error: string | null;
  inputValue: string;
  focused: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange(value: string): void;
  onSubmit(e: React.FormEvent): void;
  onChannelClick(channel: ChannelResult): void;
  onFocus(): void;
  onBlur(): void;
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      style={{
        color: active ? "var(--accent)" : "var(--text-mute)",
        transition: "color 0.2s",
      }}
    >
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M14 14l4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SearchIdleView({
  subscribedChannels,
  isLocked,
  apiUsage,
  error,
  inputValue,
  focused,
  inputRef,
  onInputChange,
  onSubmit,
  onChannelClick,
  onFocus,
  onBlur,
}: SearchIdleViewProps) {
  return (
    <div className="app__main" style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(ellipse 720px 520px at 50% 38%, rgba(255,68,68,0.10) 0%, rgba(255,68,68,0.04) 35%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 620,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        <div
          style={{
            marginBottom: 44,
            animation: "rowIn 0.5s var(--ease) both",
          }}
        >
          <Logo size="xl" />
        </div>
        {subscribedChannels.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 20,
              justifyContent: "center",
              animation: "rowIn 0.5s var(--ease) 80ms both",
            }}
          >
            {subscribedChannels.map((ch) => (
              <button
                key={ch.channelId}
                type="button"
                disabled={isLocked}
                onClick={() => onChannelClick(ch)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  padding: "5px 10px 5px 6px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  color: "var(--text-dim)",
                  background: "var(--bg-elev)",
                  cursor: isLocked ? "not-allowed" : "pointer",
                  opacity: isLocked ? 0.45 : 1,
                  transition:
                    "transform 0.18s var(--ease), filter 0.18s var(--ease)",
                  willChange: "transform",
                }}
                onMouseEnter={isLocked ? undefined : (e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.filter = "brightness(1.2)";
                }}
                onMouseLeave={isLocked ? undefined : (e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.filter = "";
                }}
              >
                {ch.thumbnailUrl && (
                  <img
                    src={ch.thumbnailUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                )}
                {ch.title}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={onSubmit}
          style={{
            width: "100%",
            animation: "rowIn 0.5s var(--ease) 160ms both",
          }}
          onFocus={onFocus}
          onBlur={onBlur}
        >
          <div style={{ position: "relative", width: "100%" }}>
            <span
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                display: "flex",
              }}
            >
              <SearchIcon active={focused} />
            </span>
            <input
              ref={inputRef}
              type="text"
              disabled={isLocked}
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={isLocked ? "Limit reached" : "What do you want to watch?"}
              style={{
                width: "100%",
                padding: "18px 52px",
                background: isLocked ? "var(--bg-elev)" : (focused ? "var(--bg-card)" : "var(--bg-elev)"),
                border: `1px solid ${!isLocked && focused ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 14,
                color: isLocked ? "var(--text-mute)" : "var(--text)",
                fontSize: 16,
                fontFamily: "var(--font-sans)",
                outline: "none",
                cursor: isLocked ? "not-allowed" : undefined,
                boxShadow: !isLocked && focused
                  ? "0 0 0 3px var(--accent-ring), 0 12px 32px -8px rgba(255,68,68,0.25), inset 0 1px 0 rgba(255,255,255,0.05)"
                  : "inset 0 1px 0 rgba(255,255,255,0.03)",
                transition:
                  "background 0.2s var(--ease), border-color 0.2s var(--ease), box-shadow 0.25s var(--ease)",
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
        <div
          style={{
            width: "100%",
            marginTop: 8,
            animation: "rowIn 0.5s var(--ease) 240ms both",
          }}
        >
          <div
            style={{
              height: 3,
              background: "var(--border)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, (apiUsage.used / apiUsage.max) * 100)}%`,
                background: "var(--accent)",
                transition: "width 0.4s var(--ease)",
              }}
            />
          </div>
          <p
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--text-mute)",
              margin: "4px 0 0",
              textAlign: "right",
            }}
          >
            {apiUsage.used.toLocaleString()} / {apiUsage.max.toLocaleString()}{" "}
            units today
          </p>
        </div>
        {error && (
          <p
            style={{
              color: "var(--accent)",
              fontSize: 13,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}
        {isLocked && (
          <p
            style={{
              color: "var(--accent)",
              fontSize: 13,
              marginTop: 12,
              textAlign: "center",
              fontFamily: "var(--font-mono)",
            }}
          >
            Daily or weekly limit reached. Come back tomorrow.
          </p>
        )}
      </div>
    </div>
  );
}
