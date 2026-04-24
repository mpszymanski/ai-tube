interface IconProps {
  size?: number;
  color?: string;
}

export function ClipboardIcon({ size = 16, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="5" y="1" width="6" height="2.5" rx="1" stroke={color} strokeWidth="1.3" />
      <path d="M4 2.5H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-10a1 1 0 0 0-1-1h-1" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon({ size = 16, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8l3.5 3.5L13 4.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CogIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M8.325 2.317a1.75 1.75 0 0 1 3.35 0l.243.98a1.25 1.25 0 0 0 1.768.806l.908-.455a1.75 1.75 0 0 1 2.369 2.369l-.455.908a1.25 1.25 0 0 0 .806 1.768l.98.243a1.75 1.75 0 0 1 0 3.35l-.98.243a1.25 1.25 0 0 0-.806 1.768l.455.908a1.75 1.75 0 0 1-2.369 2.369l-.908-.455a1.25 1.25 0 0 0-1.768.806l-.243.98a1.75 1.75 0 0 1-3.35 0l-.243-.98a1.25 1.25 0 0 0-1.768-.806l-.908.455a1.75 1.75 0 0 1-2.369-2.369l.455-.908a1.25 1.25 0 0 0-.806-1.768l-.98-.243a1.75 1.75 0 0 1 0-3.35l.98-.243a1.25 1.25 0 0 0 .806-1.768l-.455-.908a1.75 1.75 0 0 1 2.369-2.369l.908.455a1.25 1.25 0 0 0 1.768-.806l.243-.98Z"
        stroke={color}
        strokeWidth="1.5"
      />
      <circle cx="10" cy="10" r="2.5" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}
