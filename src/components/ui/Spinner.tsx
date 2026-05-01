interface SpinnerProps {
  size?: number;
  color?: string;
  trackColor?: string;
}

export default function Spinner({ size = 11, color = "currentColor", trackColor = "var(--border-strong)" }: SpinnerProps) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      border: `2px solid ${trackColor}`,
      borderTopColor: color,
      animation: "spin 0.7s linear infinite",
      flexShrink: 0,
    }} />
  );
}
