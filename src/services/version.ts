import { version } from "../../package.json";

export const CURRENT_VERSION = version;

interface UpdateInfo {
  latestVersion: string;
  releaseUrl: string;
}

function isNewer(current: string, latest: string): boolean {
  const parts = (v: string) => v.replace(/^v/, "").split(".").map(Number);
  const [ca, cb, cc] = parts(current);
  const [la, lb, lc] = parts(latest);
  if (la !== ca) return la > ca;
  if (lb !== cb) return lb > cb;
  return lc > cc;
}

export async function checkForUpdates(): Promise<UpdateInfo | null> {
  try {
    const res = await fetch("https://api.github.com/repos/mpszymanski/ai-tube/releases/latest");
    if (!res.ok) return null;
    const data = await res.json() as { tag_name: string; html_url: string };
    if (!isNewer(CURRENT_VERSION, data.tag_name)) return null;
    return { latestVersion: data.tag_name.replace(/^v/, ""), releaseUrl: data.html_url };
  } catch {
    return null;
  }
}
