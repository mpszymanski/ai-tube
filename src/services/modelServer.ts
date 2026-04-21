import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

const HEALTH_URL = "http://localhost:11434/health";
const POLL_INTERVAL_MS = 500;
const TIMEOUT_MS = 60_000;

async function isReady(): Promise<boolean> {
  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(1000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function ensureModelServer(): Promise<void> {
  console.log("[modelServer] checking if llama-server is already running...");

  if (await isReady()) {
    console.log("[modelServer] already running, skipping spawn");
    return;
  }

  // Log all sidecar output for debugging
  const unlisten = await listen<string>("llama-server-log", (e) => {
    console.log("[llama-server]", e.payload);
  });

  console.log("[modelServer] not running, invoking start_model_server...");
  try {
    await invoke("start_model_server");
    console.log("[modelServer] sidecar spawned, waiting for ready...");
  } catch (e) {
    unlisten();
    console.error("[modelServer] start_model_server invoke failed:", e);
    throw e;
  }

  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    if (await isReady()) {
      unlisten();
      console.log("[modelServer] ready");
      return;
    }
  }

  unlisten();
  throw new Error("llama-server did not become ready within 60 s");
}
