import { getKv } from "../storage/kv";
import { boundedDistinctId } from "./catalog";

export const INSTALL_ID_KEY = "refertrm.mixpanel.install-id.v1";
const INSTALL_FILE = "refertrm.mixpanel.install-id.v1.txt";

function opaqueId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function persistInstallId(id: string): void {
  getKv().set(INSTALL_ID_KEY, id);
  void writeInstallIdFile(id);
}

async function writeInstallIdFile(id: string): Promise<void> {
  try {
    const FileSystem = await import("expo-file-system/legacy");
    const dir = FileSystem.documentDirectory;
    if (!dir) return;
    await FileSystem.writeAsStringAsync(`${dir}${INSTALL_FILE}`, id);
  } catch {
    /* best-effort; memory kv still holds the id for this process */
  }
}

async function readInstallIdFile(): Promise<string | undefined> {
  try {
    const FileSystem = await import("expo-file-system/legacy");
    const dir = FileSystem.documentDirectory;
    if (!dir) return undefined;
    const uri = `${dir}${INSTALL_FILE}`;
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return undefined;
    const raw = await FileSystem.readAsStringAsync(uri);
    return raw || undefined;
  } catch {
    return undefined;
  }
}

/** Stable opaque install id. Never an email, phone, or name. */
export function getOrCreateInstallId(): string {
  const existing = boundedDistinctId(getKv().getString(INSTALL_ID_KEY));
  if (existing) return existing;
  const created = opaqueId();
  persistInstallId(created);
  return created;
}

/** Restore a previous install id from disk before the first event when possible. */
export async function hydrateInstallId(): Promise<string> {
  const existing = boundedDistinctId(getKv().getString(INSTALL_ID_KEY));
  if (existing) return existing;
  const fromFile = boundedDistinctId(await readInstallIdFile());
  if (fromFile) {
    getKv().set(INSTALL_ID_KEY, fromFile);
    return fromFile;
  }
  return getOrCreateInstallId();
}

export function resetInstallIdForTests(): void {
  getKv().delete(INSTALL_ID_KEY);
}
