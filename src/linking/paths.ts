import { parseRouteSegment } from "./ids";

export type DeepLink =
  | { type: "jobs"; id: string }
  | { type: "learn"; slug: string }
  | { type: "invalid" };

const HOSTS = new Set(["www.refertrm.com", "refertrm.com"]);

function cleanPath(pathname: string): string {
  const noQuery = pathname.split("?")[0] ?? pathname;
  const noHash = noQuery.split("#")[0] ?? noQuery;
  const trimmed = noHash.replace(/\/+$/, "") || "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function appPath(url: URL): string {
  const scheme = url.protocol.replace(":", "").toLowerCase();
  if (scheme === "refertrm") {
    const host = url.hostname.toLowerCase();
    if (host && !HOSTS.has(host)) {
      return cleanPath(`/${host}${url.pathname}`);
    }
  }
  return cleanPath(url.pathname);
}

export function parseDeepLink(raw: string): DeepLink {
  try {
    const trimmed = raw.trim();
    if (!trimmed) return { type: "invalid" };

    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      return { type: "invalid" };
    }

    const scheme = url.protocol.replace(":", "").toLowerCase();
    if (scheme !== "refertrm" && scheme !== "https") return { type: "invalid" };
    if (scheme === "https" && !HOSTS.has(url.hostname.toLowerCase())) return { type: "invalid" };

    const path = appPath(url);
    const jobs = path.match(/^\/jobs\/([^/]+)$/);
    if (jobs?.[1]) {
      const id = parseRouteSegment(jobs[1]);
      if (!id) return { type: "invalid" };
      return { type: "jobs", id };
    }
    const learn = path.match(/^\/learn\/([^/]+)$/);
    if (learn?.[1]) {
      const slug = parseRouteSegment(learn[1]);
      if (!slug) return { type: "invalid" };
      return { type: "learn", slug };
    }
    return { type: "invalid" };
  } catch {
    return { type: "invalid" };
  }
}

export function jobsHref(id: string): string {
  const safe = parseRouteSegment(id);
  if (!safe) return "/+not-found";
  return `/jobs/${encodeURIComponent(safe)}`;
}

export function learnHref(slug: string): string {
  const safe = parseRouteSegment(slug);
  if (!safe) return "/+not-found";
  return `/learn/${encodeURIComponent(safe)}`;
}
