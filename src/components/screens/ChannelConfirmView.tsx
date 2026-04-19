import { ChannelResult } from "../../types";
import BackButton from "../ui/BackButton";
import WatchTimeCounter from "../widgets/WatchTimeCounter";
import TagPicker from "../widgets/TagPicker";

interface ChannelConfirmViewProps {
  channelCandidates: ChannelResult[];
  onSelect(channel: ChannelResult | null): void;
  onBack(): void;
}

export default function ChannelConfirmView({
  channelCandidates,
  onSelect,
  onBack,
}: ChannelConfirmViewProps) {
  return (
    <>
      <div className="app__topbar" style={{ justifyContent: "space-between" }}>
        <BackButton onBack={onBack} />
        <WatchTimeCounter />
      </div>
      <div className="app__main">
        <div
          style={{
            width: "100%",
            maxWidth: 620,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-mute)",
                fontFamily: "var(--font-mono)",
                marginBottom: 10,
              }}
            >
              Which channel did you mean?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {channelCandidates.map((ch) => (
                <div
                  key={ch.channelId}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(ch)}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") && onSelect(ch)
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "var(--bg-elev)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    padding: "12px 16px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.background = "var(--bg-card)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--bg-elev)";
                  }}
                >
                  {ch.thumbnailUrl && (
                    <img
                      src={ch.thumbnailUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        flexShrink: 0,
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        color: "var(--text)",
                        fontSize: 14,
                        fontWeight: 500,
                      }}
                    >
                      {ch.title}
                    </span>
                    {ch.description && (
                      <span
                        style={{
                          color: "var(--text-mute)",
                          fontSize: 12,
                          fontFamily: "var(--font-mono)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ch.description}
                      </span>
                    )}
                  </div>
                  <TagPicker channel={ch} size="sm" />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => onSelect(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-mute)",
              fontSize: 13,
              cursor: "pointer",
              padding: "4px 0",
              textAlign: "left",
              fontFamily: "var(--font-mono)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-dim)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-mute)")
            }
          >
            Search all of YouTube instead →
          </button>
        </div>
      </div>
    </>
  );
}
