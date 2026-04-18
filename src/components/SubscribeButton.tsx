import { useState } from "react";
import { ChannelResult } from "../types";
import { isSubscribed, subscribe, unsubscribe } from "../services/subscriptions";

interface SubscribeButtonProps {
  channel: ChannelResult;
  size?: "sm" | "md";
}

export default function SubscribeButton({ channel, size = "md" }: SubscribeButtonProps) {
  const [subscribed, setSubscribed] = useState(() => isSubscribed(channel.channelId));

  const fontSize = size === "sm" ? 11 : 12;
  const padding = size === "sm" ? "4px 10px" : "6px 14px";

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (subscribed) {
      unsubscribe(channel.channelId);
      setSubscribed(false);
    } else {
      subscribe(channel);
      setSubscribed(true);
    }
  }

  return (
    <button
      onClick={handleClick}
      style={{
        flexShrink: 0,
        background: subscribed ? "transparent" : "var(--accent)",
        border: subscribed ? "1px solid var(--border-strong)" : "1px solid transparent",
        borderRadius: "var(--radius-sm)",
        color: subscribed ? "var(--text-dim)" : "#fff",
        fontSize,
        fontFamily: "var(--font-mono)",
        padding,
        cursor: "pointer",
        transition: "background 0.15s, color 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        if (subscribed) {
          e.currentTarget.style.borderColor = "var(--accent)";
          e.currentTarget.style.color = "var(--accent)";
        }
      }}
      onMouseLeave={(e) => {
        if (subscribed) {
          e.currentTarget.style.borderColor = "var(--border-strong)";
          e.currentTarget.style.color = "var(--text-dim)";
        }
      }}
    >
      {subscribed ? "Subscribed" : "Subscribe"}
    </button>
  );
}
