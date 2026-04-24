const KEY = "aitube_search_history";
const MAX = 15;

export function getHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addToHistory(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  const history = getHistory().filter((q) => q !== trimmed);
  history.unshift(trimmed);
  localStorage.setItem(KEY, JSON.stringify(history.slice(0, MAX)));
}
