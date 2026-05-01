import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { log } from "./logger";

export interface DownloadProgress {
  downloaded: number;
  total: number;
}

export async function checkModelExists(): Promise<boolean> {
  const exists = await invoke<boolean>("model_exists");
  log("model", "check_exists", { exists });
  return exists;
}

export async function downloadModel(
  onProgress: (progress: DownloadProgress) => void,
): Promise<void> {
  log("model", "download_start", {});
  const t0 = Date.now();
  let lastProgress: DownloadProgress | null = null as DownloadProgress | null;

  const unlisten = await listen<DownloadProgress>("model-download-progress", (e) => {
    onProgress(e.payload);
    lastProgress = e.payload;
  });
  try {
    await invoke("download_model");
    log("model", "download_complete", {
      ms: Date.now() - t0,
      bytes: lastProgress?.total ?? null,
    });
  } catch (e) {
    log("model", "download_error", { ms: Date.now() - t0, error: String(e) });
    throw e;
  } finally {
    unlisten();
  }
}
