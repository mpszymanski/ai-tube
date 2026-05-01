import { ReactNode } from "react";

export default function BannerStack({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: "fixed", bottom: 12, right: 12, zIndex: 9999, display: "flex", flexDirection: "column-reverse", gap: 8 }}>
      {children}
    </div>
  );
}
