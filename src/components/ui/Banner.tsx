import { ReactNode } from "react";

interface BannerProps {
  children: ReactNode;
  color?: string;
}

export default function Banner({ children, color = "var(--text-dim)" }: BannerProps) {
  return (
    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 14px", fontSize: 12, color, minWidth: 220 }}>
      {children}
    </div>
  );
}
