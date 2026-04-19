import { readTextFile, writeTextFile, mkdir, exists, BaseDirectory } from "@tauri-apps/plugin-fs";
import type { StorageAdapter } from "./adapter";

const APP_DIR = "aitube";

function keyToPath(key: string): string {
  return `${APP_DIR}/${key.replace(/^aitube_/, "")}.json`;
}

export class TauriFileAdapter implements StorageAdapter {
  private dirReady: Promise<void>;

  constructor() {
    this.dirReady = mkdir(APP_DIR, {
      baseDir: BaseDirectory.AppData,
      recursive: true,
    }).catch(() => {
      // Directory already exists — safe to ignore
    });
  }

  async get(key: string): Promise<string | null> {
    await this.dirReady;
    const path = keyToPath(key);
    try {
      const fileExists = await exists(path, { baseDir: BaseDirectory.AppData });
      if (!fileExists) return null;
      return await readTextFile(path, { baseDir: BaseDirectory.AppData });
    } catch {
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    await this.dirReady;
    await writeTextFile(keyToPath(key), value, { baseDir: BaseDirectory.AppData });
  }
}
