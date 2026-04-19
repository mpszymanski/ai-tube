import { ReactNode } from "react";

function Spinner() {
  return (
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        border: "2px solid var(--border-strong)",
        borderTopColor: "var(--accent)",
        animation: "spin 0.7s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M2.5 7l3.5 3.5 5.5-6"
        stroke="var(--success)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ThinkingRowProps {
  label: string;
  children: ReactNode;
  status: "pending" | "done";
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "14px 18px",
  animation: "rowIn 0.5s var(--ease) forwards",
  opacity: 0,
};

const labelStyle: React.CSSProperties = {
  color: "var(--text-mute)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  minWidth: 78,
  flexShrink: 0,
};

export default function ThinkingRow({ label, children, status }: ThinkingRowProps) {
  return (
    <div style={rowStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={{ flex: 1 }}>{children}</span>
      {status === "done" ? <CheckIcon /> : <Spinner />}
    </div>
  );
}
