import { CogIcon } from "./Icons";
import { useWatchLimit } from "../../context/WatchLimitContext";

export default function SettingsButton() {
  const { onSettings } = useWatchLimit();
  return (
    <button
      onClick={onSettings}
      title="Settings"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "none",
        color: "var(--text-dim)",
        padding: 8,
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
        transition: "color 0.15s, background 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--text)";
        e.currentTarget.style.background = "var(--bg-elev)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--text-dim)";
        e.currentTarget.style.background = "transparent";
      }}
    >
      <CogIcon size={16} />
    </button>
  );
}
