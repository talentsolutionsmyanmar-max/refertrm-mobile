import { tap } from "../theme";

/** Device QA viewport from the NO-GO brief. */
export const ACADEMY_QA_VIEWPORT = { width: 390, height: 844 } as const;

/** Minimum tappable course card; real cards are taller (title + category + meta). */
export const COURSE_CARD_MIN_HEIGHT = tap;

/**
 * Compact academy chrome: search and a single horizontal topic row.
 * Categories no longer wrap, so this stays a fixed band instead of eating the list.
 */
export function academyChromeHeight(options: { banner?: boolean } = {}): number {
  const paddingTop = 12;
  const countLine = 24;
  const search = tap;
  const gapAfterSearch = 12;
  const topicRow = tap;
  const banner = options.banner ? 52 : 0;
  return paddingTop + countLine + search + gapAfterSearch + topicRow + banner;
}

export function academyListVisibleHeight(
  viewportHeight = ACADEMY_QA_VIEWPORT.height,
  options: { banner?: boolean } = {},
): number {
  return viewportHeight - academyChromeHeight(options);
}
