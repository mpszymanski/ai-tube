import { createContext, useContext, ReactNode } from "react";

interface WatchLimitValue {
  todaySeconds: number;
  weekSeconds: number;
  dailyLimitSeconds: number;
  weeklyLimitSeconds: number;
  isLocked: boolean;
  onSettings(): void;
}

const WatchLimitContext = createContext<WatchLimitValue | null>(null);

export function useWatchLimit(): WatchLimitValue {
  const ctx = useContext(WatchLimitContext);
  if (!ctx) throw new Error("useWatchLimit used outside WatchLimitProvider");
  return ctx;
}

interface ProviderProps {
  children: ReactNode;
  value: WatchLimitValue;
}

export function WatchLimitProvider({ children, value }: ProviderProps) {
  return <WatchLimitContext.Provider value={value}>{children}</WatchLimitContext.Provider>;
}
