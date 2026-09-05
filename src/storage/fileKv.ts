import * as FileSystem from "expo-file-system/legacy";
import { getKv, memoryKv, type KeyValue } from "./kv";

const CATALOG_KEY = "refertrm.p1.catalog.v1";
const cache = new Map<string, string>();

function fileUri(): string | null {
  const dir = FileSystem.documentDirectory;
  return dir ? `${dir}refertrm.p1.catalog.v1.json` : null;
}

async function readFile(): Promise<string | undefined> {
  const uri = fileUri();
  if (!uri) return undefined;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return undefined;
    const raw = await FileSystem.readAsStringAsync(uri);
    return raw || undefined;
  } catch {
    return undefined;
  }
}

async function writeFile(value: string): Promise<void> {
  const uri = fileUri();
  if (!uri) return;
  try {
    await FileSystem.writeAsStringAsync(uri, value);
  } catch {
    /* persist is best-effort */
  }
}

async function removeFile(): Promise<void> {
  const uri = fileUri();
  if (!uri) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
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

export async function hydrateCatalogFromFile(): Promise<void> {
  const kv = getKv();
  if (kv.getString(CATALOG_KEY)) return;
  const raw = await readFile();
  if (!raw) return;
  kv.set(CATALOG_KEY, raw);
  if (kv !== memoryKv) memoryKv.set(CATALOG_KEY, raw);
  cache.set(CATALOG_KEY, raw);
}

export async function persistCatalogToFile(): Promise<void> {
  const raw = getKv().getString(CATALOG_KEY);
  if (!raw) return;
  cache.set(CATALOG_KEY, raw);
  await writeFile(raw);
}
