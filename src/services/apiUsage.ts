const STORAGE_KEY = "aitube_api_quota";
const MAX_UNITS = 10000;

interface UsageData {
  date: string;
  units: number;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function readUsage(): UsageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as UsageData;
      if (data.date === today()) return data;
    }
  } catch {}
  return { date: today(), units: 0 };
}

export function recordUnits(units: number): void {
  const data = readUsage();
  data.units += units;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getUsage(): { used: number; max: number } {
  const data = readUsage();
  return { used: data.units, max: MAX_UNITS };
}
