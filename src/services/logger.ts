import { readDir, remove, writeTextFile, mkdir, BaseDirectory } from "@tauri-apps/plugin-fs";

const LOGS_DIR = "aitube/logs";
const BASE = { baseDir: BaseDirectory.AppData };

let initPromise: Promise<void> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

function todayFilename(): string {
  return `${new Date().toISOString().slice(0, 10)}.log`;
}

async function doInit(): Promise<void> {
  await mkdir(LOGS_DIR, { ...BASE, recursive: true }).catch(() => {});
  const entries = await readDir(LOGS_DIR, BASE).catch(() => []);
  const logFiles = entries
    .filter((e) => e.isFile && e.name.endsWith(".log"))
    .map((e) => e.name)
    .sort()
    .reverse(); // newest first

  const today = todayFilename();
  const hasTodayFile = logFiles.includes(today);
  // Reserve a slot for today; keep at most 3 total
  const keepCount = hasTodayFile ? 3 : 2;

  for (const name of logFiles.slice(keepCount)) {
    await remove(`${LOGS_DIR}/${name}`, BASE).catch(() => {});
  }
}

function ensureInit(): Promise<void> {
  if (!initPromise) initPromise = doInit();
  return initPromise;
}

export function log(cat: string, event: string, data?: Record<string, unknown>): void {
  if (!isTauri()) {
    console.debug(`[log:${cat}:${event}]`, data);
    return;
  }
  const line =
    JSON.stringify({
      ts: new Date().toISOString(),
      cat,
      event,
      ...(data ? { data } : {}),
    }) + "\n";
  writeQueue = writeQueue
    .then(() => ensureInit())
    .then(() => writeTextFile(`${LOGS_DIR}/${todayFilename()}`, line, { ...BASE, append: true }))
    .catch(() => {});
}
