import { parseRouteSegment } from "./ids";

const LEARN_BASE = "https://www.refertrm.com/learn/";

/**
 * Website address for a /learn/<slug> link the app cannot show itself
 * (for example a public help article that is not an Academy lesson).
 * Returns null when the slug is missing or not a safe single path segment.
 */
export function webLessonUrl(rawSlug: string | string[] | undefined | null): string | null {
  const raw = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const slug = parseRouteSegment(raw ?? null);
  if (!slug) return null;
  return LEARN_BASE + encodeURIComponent(slug);
}
