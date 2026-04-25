import { useState } from "react";
import { youtubeWatchUrl } from "../utils/urls";

export function useCopyLink(videoId: string) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e?: React.MouseEvent) {
    e?.stopPropagation();
    navigator.clipboard.writeText(youtubeWatchUrl(videoId)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return { copied, handleCopy };
}
