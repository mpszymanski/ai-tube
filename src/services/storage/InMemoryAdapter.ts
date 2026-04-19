import type { StorageAdapter } from "./adapter";

export class InMemoryAdapter implements StorageAdapter {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  seed(key: string, value: unknown): void {
    this.store.set(key, JSON.stringify(value));
  }

  read(key: string): unknown | null {
    const raw = this.store.get(key);
    return raw ? JSON.parse(raw) : null;
  }
}
