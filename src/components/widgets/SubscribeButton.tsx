import { useState, useEffect } from "react";
import { ChannelResult } from "../../types";
import { isSubscribed, subscribe, unsubscribe, subscribeToChanges } from "../../services/subscriptions";

interface SubscribeButtonProps {
  channel: ChannelResult;
  size?: "sm" | "md";
}

export default function SubscribeButton({ channel, size = "md" }: SubscribeButtonProps) {
  const [subscribed, setSubscribed] = useState(() => isSubscribed(channel.channelId));

  useEffect(() => {
    setSubscribed(isSubscribed(channel.channelId));
    return subscribeToChanges(() => setSubscribed(isSubscribed(channel.channelId)));
  }, [channel.channelId]);

  function handleClick() {
    if (subscribed) {
      unsubscribe(channel.channelId);
    } else {
      subscribe(channel);
    }
  }

  const fontSize = size === "sm" ? 11 : 12;
  const padding = size === "sm" ? "4px 10px" : "6px 14px";

  return (
    <button
      onClick={handleClick}
      style={{
        flexShrink: 0,
        fontSize,
        fontFamily: "var(--font-mono)",
        padding,
        borderRadius: "var(--radius-sm)",
        border: subscribed ? "1px solid transparent" : "1px solid var(--accent)",
        background: subscribed ? "var(--accent)" : "transparent",
        color: "#fff",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      {subscribed ? "Subscribed" : "Subscribe"}
    </button>
  );
}
