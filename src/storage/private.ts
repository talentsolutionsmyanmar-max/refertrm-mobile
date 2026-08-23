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

const FORBIDDEN_KEY = /(?:access|refresh|auth|bearer|session)?token|password|secret|authorization|credential/i;

function containsCredentialShape(value: unknown, seen = new Set<object>()): boolean {
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);

  if (Array.isArray(value)) return value.some((entry) => containsCredentialShape(entry, seen));
  return Object.entries(value).some(([key, entry]) => FORBIDDEN_KEY.test(key) || containsCredentialShape(entry, seen));
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
      if (containsCredentialShape(data)) {
        throw new Error("Credential-shaped data is forbidden in the private cache.");
      }
      const envelope: Envelope = { schemaVersion: PRIVATE_CACHE_SCHEMA_VERSION, data };
      adapter.set(storageKey(domain), JSON.stringify(envelope));
    },
    clearAll(): void {
      for (const domain of PRIVATE_CACHE_DOMAINS) adapter.delete(storageKey(domain));
    },
  };
}
