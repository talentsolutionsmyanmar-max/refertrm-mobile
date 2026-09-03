/**
 * External destinations must be https with a real hostname.
 * Internal ReferTRM links are allowed. javascript:/file:/intent: are not.
 */
const INTERNAL_HOSTS = new Set(["www.refertrm.com", "refertrm.com"]);

export function safeHttpsUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2000) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost")) return null;
  if (!host.includes(".")) return null;
  if (host.startsWith(".") || host.endsWith(".")) return null;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  if (host.includes("..")) return null;
  return url.toString();
}

export function isInternalHttps(raw: unknown): boolean {
  const url = safeHttpsUrl(raw);
  if (!url) return false;
  try {
    return INTERNAL_HOSTS.has(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}
