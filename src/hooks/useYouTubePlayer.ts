import { useEffect, useRef } from "react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface PlayerCallbacks {
  onPlaying(): void;
  onPaused(): void;
}

export function useYouTubePlayer(
  videoId: string,
  callbacks: PlayerCallbacks,
): React.RefObject<HTMLDivElement | null> {
  const playerDivRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    function initPlayer() {
      if (!playerDivRef.current) return;
      playerRef.current = new window.YT.Player(playerDivRef.current, {
        videoId,
        playerVars: { autoplay: 1, enablejsapi: 1 },
        events: {
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              callbacksRef.current.onPlaying();
            } else {
              callbacksRef.current.onPaused();
            }
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      if (!document.getElementById("yt-iframe-api")) {
        const script = document.createElement("script");
        script.id = "yt-iframe-api";
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }
    }

    return () => {
      if (playerRef.current?.destroy) {
        try { playerRef.current.destroy(); } catch { /* ignore */ }
      }
      playerRef.current = null;
    };
  }, [videoId]);

  return playerDivRef;
}
