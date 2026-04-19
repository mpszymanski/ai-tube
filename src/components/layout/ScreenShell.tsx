import { ReactNode } from "react";
import BackButton from "../ui/BackButton";
import SettingsButton from "../ui/SettingsButton";
import WatchTimeCounter from "../widgets/WatchTimeCounter";

interface ScreenShellProps {
  children: ReactNode;
  onBack(): void;
}

export default function ScreenShell({ children, onBack }: ScreenShellProps) {
  return (
    <div className="app">
      <div className="app__topbar">
        <BackButton onBack={onBack} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SettingsButton />
          <WatchTimeCounter />
        </div>
      </div>
      <div className="app__main" style={{ justifyContent: "flex-start", paddingTop: 96 }}>
        {children}
      </div>
    </div>
  );
}
