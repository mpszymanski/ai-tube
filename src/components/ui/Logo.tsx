interface LogoProps {
  size: "sm" | "lg" | "xl";
}

const sizes = {
  sm: { markW: 28, markH: 20, markRadius: 5, fontSize: 15, letterSpacing: "-0.01em", glyphSize: 10 },
  lg: { markW: 72, markH: 50, markRadius: 12, fontSize: 44, letterSpacing: "-0.03em", glyphSize: 22 },
  xl: { markW: 90, markH: 62, markRadius: 14, fontSize: 56, letterSpacing: "-0.035em", glyphSize: 28 },
};

export default function Logo({ size }: LogoProps) {
  const s = sizes[size];
  const gradId = `logo-grad-${size}`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg
        width={s.markW}
        height={s.markH}
        viewBox={`0 0 ${s.markW} ${s.markH}`}
        style={{ borderRadius: s.markRadius, flexShrink: 0 }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9b7aff" />
            <stop offset="100%" stopColor="#5b3dd6" />
          </linearGradient>
        </defs>
        <rect width={s.markW} height={s.markH} rx={s.markRadius} fill={`url(#${gradId})`} />
        <svg
          x={(s.markW - s.glyphSize) / 2}
          y={(s.markH - s.glyphSize) / 2}
          width={s.glyphSize}
          height={s.glyphSize}
          viewBox="0 0 14 14"
        >
          <path d="M3.5 2v10l8-5-8-5z" fill="#fff" />
        </svg>
      </svg>
      <span
        style={{
          fontSize: s.fontSize,
          letterSpacing: s.letterSpacing,
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        <span style={{ color: "var(--text)", fontWeight: 600 }}>AI</span>
        <span style={{ color: "var(--text-dim)", fontWeight: 500 }}>Tube</span>
      </span>
    </div>
  );
}
