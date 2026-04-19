import { ReactNode } from "react";
import BackButton from "../ui/BackButton";
import WatchTimeCounter from "../widgets/WatchTimeCounter";
import { CogIcon } from "../ui/Icons";

interface ScreenShellProps {
  children: ReactNode;
  onBack(): void;
  onSettings(): void;
  todaySeconds: number;
  weekSeconds: number;
}

export default function ScreenShell({ children, onBack, onSettings, todaySeconds, weekSeconds }: ScreenShellProps) {
  return (
    <div className="app">
      <div className="app__topbar">
        <BackButton onBack={onBack} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
          <WatchTimeCounter todaySeconds={todaySeconds} weekSeconds={weekSeconds} />
        </div>
      </div>
      <div className="app__main" style={{ justifyContent: "flex-start", paddingTop: 96 }}>
        {children}
      </div>
    </div>
  );
}
