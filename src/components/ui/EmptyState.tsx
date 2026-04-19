import { ReactNode } from "react";

function EmptyBoxIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3 8l8-5 8 5v8l-8 5-8-5V8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3 8l8 5 8-5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M11 13v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?(): void;
  icon?: ReactNode;
}

export default function EmptyState({ title, subtitle, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 40 }}>
      {icon !== undefined ? icon : (
        <div
          style={{
            width: 48,
            height: 48,
            background: "var(--bg-elev)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-dim)",
          }}
        >
          <EmptyBoxIcon />
        </div>
      )}
      <p style={{ fontSize: 17, fontWeight: 500, color: "var(--text)" }}>{title}</p>
      {subtitle && (
        <p style={{ fontSize: 13.5, color: "var(--text-dim)", textAlign: "center" }}>{subtitle}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: 4,
            padding: "8px 16px",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            color: "var(--text-dim)",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
