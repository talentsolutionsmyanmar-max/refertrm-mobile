import { PRIVATE_CACHE_SCHEMA_VERSION } from "../cache/schema";

export const PRIVATE_CACHE_DOMAINS = ["home-summary", "profile-display", "notifications"] as const;
export type PrivateCacheDomain = (typeof PRIVATE_CACHE_DOMAINS)[number];

export interface EncryptedPrivateAdapter {
  readonly security: "encrypted";
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}

interface Envelope {
  schemaVersion: number;
  data: unknown;
}

const FORBIDDEN_KEYS = new Set([
  "authorization",
  "cookie",
  "setcookie",
  "session",
  "accesstoken",
  "refreshtoken",
  "idtoken",
  "token",
  "password",
  "secret",
  "apikey",
  "credential",
  "authtoken",
  "bearertoken",
]);
const AUTHENTICATION_HEADER = /^\s*(?:authorization\s*:\s*)?(?:(?:bearer|basic|token)\s+\S+|digest\s+\S.*)\s*$/i;
const MAX_TRAVERSAL_DEPTH = 64;
const MAX_TRAVERSAL_NODES = 10_000;

interface TraversalState {
  readonly seen: Set<object>;
  nodes: number;
}

function normalizeKey(key: string): string {
  return key.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function containsCredentialShape(
  value: unknown,
  state: TraversalState = { seen: new Set<object>(), nodes: 0 },
  depth = 0,
): boolean {
  if (typeof value === "string") return AUTHENTICATION_HEADER.test(value);
  if (value === null || typeof value === "boolean") return false;
  if (typeof value === "number") return !Number.isFinite(value);
  if (typeof value !== "object") return true;
  if (depth > MAX_TRAVERSAL_DEPTH || ++state.nodes > MAX_TRAVERSAL_NODES) return true;
  if (state.seen.has(value)) return true;
  state.seen.add(value);

  if (Array.isArray(value)) {
    return value.some((entry) => containsCredentialShape(entry, state, depth + 1));
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return true;
  if (Reflect.ownKeys(value).some((key) => typeof key === "symbol")) return true;
  return Object.entries(value).some(
    ([key, entry]) => FORBIDDEN_KEYS.has(normalizeKey(key)) || containsCredentialShape(entry, state, depth + 1),
  );
}

function storageKey(domain: PrivateCacheDomain): string {
  return `refertrm.private.v${PRIVATE_CACHE_SCHEMA_VERSION}.${domain}`;
}

export function createPrivateCache(adapter: EncryptedPrivateAdapter) {
  if (adapter.security !== "encrypted") {
    throw new Error("Private cache requires an encrypted storage adapter.");
  }

  return {
    read(domain: PrivateCacheDomain): unknown | null {
      const raw = adapter.getString(storageKey(domain));
      if (!raw) return null;
      try {
        const envelope = JSON.parse(raw) as Envelope;
        if (envelope.schemaVersion !== PRIVATE_CACHE_SCHEMA_VERSION) return null;
        return envelope.data;
      } catch {
        return null;
      }
    },
    write(domain: PrivateCacheDomain, data: unknown): void {
      let serialized: string;
      try {
        if (containsCredentialShape(data)) throw new Error("unsafe");
        const envelope: Envelope = { schemaVersion: PRIVATE_CACHE_SCHEMA_VERSION, data };
        serialized = JSON.stringify(envelope);
      } catch {
        throw new Error("Credential-shaped data is forbidden in the private cache.");
      }
      adapter.set(storageKey(domain), serialized);
    },
    clearAll(): void {
      for (const domain of PRIVATE_CACHE_DOMAINS) adapter.delete(storageKey(domain));
    },
  };
}
