import type { StorageAdapter } from "./adapter";
import { TauriFileAdapter } from "./TauriFileAdapter";

let _adapter: StorageAdapter = new TauriFileAdapter();

export function getAdapter(): StorageAdapter {
  return _adapter;
}

export function setAdapter(adapter: StorageAdapter): void {
  _adapter = adapter;
}
