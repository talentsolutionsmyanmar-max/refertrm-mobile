export type ParsedDeepLink = { type: "start" } | { type: "invalid" } | { type: "other" };

const TRAILING_SLASH = /^\/(?:jobs|learn|academy|start)\/$/i;
const HTTPS_HOSTS = new Set(["www.refertrm.com", "refertrm.com"]);

export function parseDeepLink(raw: string): ParsedDeepLink {
  const trimmed = raw.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { type: "invalid" };
  }

  const protocol = url.protocol.toLowerCase();
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname || "";

  if (protocol === "refertrm:") {
    return trimmed.toLowerCase() === "refertrm://start" ? { type: "start" } : { type: "invalid" };
  }

  if (protocol !== "https:") {
    return { type: "other" };
  }

  if (!HTTPS_HOSTS.has(hostname)) {
    return { type: "other" };
  }

  if (TRAILING_SLASH.test(pathname)) {
    return { type: "invalid" };
  }

  if (pathname.toLowerCase() === "/start") {
    return { type: "start" };
  }

  return { type: "other" };
}
