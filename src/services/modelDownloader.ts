import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export interface DownloadProgress {
  downloaded: number;
  total: number;
}

export async function checkModelExists(): Promise<boolean> {
  return invoke<boolean>("model_exists");
}

export async function downloadModel(
  onProgress: (progress: DownloadProgress) => void,
): Promise<void> {
  const unlisten = await listen<DownloadProgress>("model-download-progress", (e) => {
    onProgress(e.payload);
  });
  try {
    await invoke("download_model");
  } finally {
    unlisten();
  }
}
