import * as FileSystem from "expo-file-system/legacy";
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

function fileUri(): string | null {
  const dir = FileSystem.documentDirectory;
  return dir ? `${dir}${INSTALL_FILE}` : null;
}

function persistInstallId(id: string): void {
  getKv().set(INSTALL_ID_KEY, id);
  void writeInstallIdFile(id);
}

async function writeInstallIdFile(id: string): Promise<void> {
  const uri = fileUri();
  if (!uri) return;
  try {
    await FileSystem.writeAsStringAsync(uri, id);
  } catch {
    /* best-effort; memory kv still holds the id for this process */
  }
}

async function readInstallIdFile(): Promise<string | undefined> {
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

function getOrCreateInstallId(): string {
  const existing = boundedDistinctId(getKv().getString(INSTALL_ID_KEY));
  if (existing) return existing;
  const created = opaqueId();
  persistInstallId(created);
  return created;
}

async function loadInstallId(): Promise<string> {
  const existing = boundedDistinctId(getKv().getString(INSTALL_ID_KEY));
  if (existing) return existing;
  const fromFile = boundedDistinctId(await readInstallIdFile());
  if (fromFile) {
    getKv().set(INSTALL_ID_KEY, fromFile);
    return fromFile;
  }
  return getOrCreateInstallId();
}

let hydratePromise: Promise<string> | null = null;

/** Shared hydrate-then-create. All Mixpanel posts must await this before using distinct_id. */
export function ensureInstallId(): Promise<string> {
  if (!hydratePromise) {
    hydratePromise = loadInstallId().catch(() => getOrCreateInstallId());
  }
  return hydratePromise;
}

export function resetInstallIdForTests(): void {
  getKv().delete(INSTALL_ID_KEY);
  hydratePromise = null;
}
