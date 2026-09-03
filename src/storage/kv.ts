/** Tiny string store. Native MMKV is wired from app/_layout. Tests use memory. */

export type KeyValue = {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
};

const memory = new Map<string, string>();

export const memoryKv: KeyValue = {
  getString: (key) => memory.get(key),
  set: (key, value) => {
    memory.set(key, value);
  },
  delete: (key) => {
    memory.delete(key);
  },
};

let kv: KeyValue = memoryKv;

export function setKv(next: KeyValue): void {
  kv = next;
}

export function getKv(): KeyValue {
  return kv;
}

export function resetMemoryKv(): void {
  memory.clear();
  kv = memoryKv;
}
