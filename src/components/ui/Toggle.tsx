interface ToggleProps {
  checked: boolean;
  onChange(checked: boolean): void;
  label?: string;
  disabled?: string;
}

export default function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <div
      title={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
      }}
      onClick={() => { if (!disabled) onChange(!checked); }}
    >
      <div
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          background: checked ? "var(--accent)" : "var(--bg-elev)",
          border: "1px solid var(--border)",
          position: "relative",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: checked ? "#fff" : "var(--text-mute)",
            transition: "left 0.2s",
          }}
        />
      </div>
      {label && (
        <span style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: "var(--font-mono)", userSelect: "none" }}>
          {label}
        </span>
      )}
    </div>
  );
}
