import Spinner from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  onClick?(): void;
  children: React.ReactNode;
  title?: string;
  type?: "button" | "submit" | "reset";
  style?: React.CSSProperties;
}

const VARIANT_BASE: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { background: "var(--accent)", color: "#fff", border: "none" },
  secondary: { background: "transparent", color: "var(--text-dim)", border: "1px solid var(--border-strong)" },
  ghost:     { background: "transparent", color: "var(--text-dim)", border: "none" },
};

const VARIANT_DISABLED: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { background: "var(--border-strong)", color: "var(--text-mute)" },
  secondary: { opacity: 0.45 },
  ghost:     { opacity: 0.45 },
};

const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "6px 14px",   fontSize: 12, fontFamily: "var(--font-mono)", borderRadius: "var(--radius-sm)" },
  md: { padding: "11px 20px",  fontSize: 14, fontWeight: 500,               borderRadius: "var(--radius)" },
};

export default function Button({
  variant = "secondary",
  size = "sm",
  loading = false,
  disabled = false,
  onClick,
  children,
  title,
  type = "button",
  style,
}: ButtonProps) {
  const inactive = disabled || loading;

  const computedStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    cursor: inactive ? (loading ? "default" : "not-allowed") : "pointer",
    transition: "background 0.15s, border-color 0.15s, color 0.15s",
    ...SIZE_STYLES[size],
    ...VARIANT_BASE[variant],
    ...(disabled && !loading ? VARIANT_DISABLED[variant] : {}),
    ...style,
  };

  function onMouseEnter(e: React.MouseEvent<HTMLButtonElement>) {
    if (inactive) return;
    if (variant === "primary")   e.currentTarget.style.background = "var(--accent-dim)";
    if (variant === "secondary") { e.currentTarget.style.borderColor = "var(--text-dim)"; e.currentTarget.style.color = "var(--text)"; }
    if (variant === "ghost")     { e.currentTarget.style.background = "var(--bg-elev)"; e.currentTarget.style.color = "var(--text)"; }
  }

  function onMouseLeave(e: React.MouseEvent<HTMLButtonElement>) {
    if (inactive) return;
    if (variant === "primary")   e.currentTarget.style.background = "var(--accent)";
    if (variant === "secondary") { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text-dim)"; }
    if (variant === "ghost")     { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-dim)"; }
  }

  return (
    <button
      type={type}
      disabled={inactive}
      onClick={onClick}
      title={title}
      style={computedStyle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {loading
        ? <Spinner trackColor={variant === "primary" ? "rgba(255,255,255,0.4)" : undefined} />
        : children}
    </button>
  );
}
