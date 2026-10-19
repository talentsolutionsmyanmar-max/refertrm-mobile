import * as FileSystem from "expo-file-system/legacy";
import { getKv, memoryKv, type KeyValue } from "./kv";

const CATALOG_KEY = "refertrm.p1.catalog.v1";
const cache = new Map<string, string>();

function isCatalogJson(raw: string): boolean {
  try {
    JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
}

function fileUri(): string | null {
  const dir = FileSystem.documentDirectory;
  return dir ? `${dir}refertrm.p1.catalog.v1.json` : null;
}

async function readFile(): Promise<string | undefined> {
  const uri = fileUri();
  if (!uri) return undefined;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      const raw = await FileSystem.readAsStringAsync(uri);
      if (raw && isCatalogJson(raw)) return raw;
    }
    const tmp = `${uri}.tmp`;
    const tmpInfo = await FileSystem.getInfoAsync(tmp);
    if (tmpInfo.exists) {
      const raw = await FileSystem.readAsStringAsync(tmp);
      if (raw && isCatalogJson(raw)) return raw;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

async function writeFile(value: string): Promise<void> {
  const uri = fileUri();
  if (!uri) return;
  const tmp = `${uri}.tmp`;
  try {
    await FileSystem.writeAsStringAsync(tmp, value);
    // expo-file-system 19 moveAsync replaces the destination on iOS (native removes it first);
    // Android uses renameTo, which atomically replaces the target file.
    await FileSystem.moveAsync({ from: tmp, to: uri });
  } catch {
    try {
      await FileSystem.deleteAsync(tmp, { idempotent: true });
    } catch {
      /* best-effort cleanup */
    }
  }
}

async function removeFile(): Promise<void> {
  const uri = fileUri();
  if (!uri) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
    await FileSystem.deleteAsync(`${uri}.tmp`, { idempotent: true });
  } catch {
    /* persist is best-effort */
  }
}

export const fileKv: KeyValue = {
  getString: (key) => cache.get(key),
  set: (key, value) => {
    cache.set(key, value);
    if (key === CATALOG_KEY) void writeFile(value);
  },
  delete: (key) => {
    cache.delete(key);
    if (key === CATALOG_KEY) void removeFile();
  },
};

let hydrateInflight: Promise<void> | null = null;

export async function hydrateCatalogFromFile(): Promise<void> {
  if (getKv().getString(CATALOG_KEY)) return;
  if (!hydrateInflight) {
    hydrateInflight = (async () => {
      const kv = getKv();
      if (kv.getString(CATALOG_KEY)) return;
      const raw = await readFile();
      if (!raw) return;
      if (getKv().getString(CATALOG_KEY)) return;
      kv.set(CATALOG_KEY, raw);
      if (kv !== memoryKv) memoryKv.set(CATALOG_KEY, raw);
      cache.set(CATALOG_KEY, raw);
    })().finally(() => {
      hydrateInflight = null;
    });
  }
  await hydrateInflight;
}

export function resetHydrateCatalogForTests(): void {
  hydrateInflight = null;
}

let persistTimer: ReturnType<typeof setTimeout> | undefined;
let persistChain: Promise<void> = Promise.resolve();

/** Coalesce rapid catalogue writes into one disk flush (job/module bodies + list sync). */
export function schedulePersistCatalogToFile(): void {
  if (persistTimer !== undefined) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = undefined;
    persistChain = persistChain.then(() => persistCatalogToFile());
  }, 25);
}

/** Run a pending debounced flush (app background + tests). Never writes unless a timer was scheduled. */
export async function flushScheduledCatalogPersist(): Promise<void> {
  if (persistTimer !== undefined) {
    clearTimeout(persistTimer);
    persistTimer = undefined;
    persistChain = persistChain.then(() => persistCatalogToFile());
  }
  await persistChain;
}

export function resetCatalogPersistForTests(): void {
  if (persistTimer !== undefined) clearTimeout(persistTimer);
  persistTimer = undefined;
  persistChain = Promise.resolve();
}

/** Deletes on-disk catalogue bytes (main + .tmp). Used by tests and explicit eviction paths. */
export async function deletePersistedCatalogFiles(): Promise<void> {
  await removeFile();
}

export async function persistCatalogToFile(): Promise<void> {
  const raw = getKv().getString(CATALOG_KEY);
  if (!raw) return;
  cache.set(CATALOG_KEY, raw);
  await writeFile(raw);
}
