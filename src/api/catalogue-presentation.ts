import { copy } from "../copy/en";

/**
 * Keep unavailable catalogue state distinct from a successful empty result.
 * Counts always reflect the last successful loader payload (`modules.length` / `jobs.length`).
 * A device count above the live API (e.g. 193 vs 192 lessons) is a stale on-disk catalogue
 * until pull-to-refresh returns `fromCache: false` — not a hardcoded figure.
 */
export function cataloguePresentation(state: {
  count: number;
  hasData: boolean;
  fromCache: boolean;
  isError: boolean;
  online: boolean;
}) {
  // Do not treat a failed background refetch as stale when we still hold the last live sync.
  const stale = state.fromCache || !state.online;
  return {
    stale,
    showCount:
      state.hasData &&
      (state.count > 0 || (!state.isError && !state.fromCache && state.online)),
    emptyOffline: state.count === 0 && !state.online,
  };
}

/** Banner copy when a detail or list row is shown from cache, after an error, or while offline. */
export function staleContentBanner(state: {
  hasContent: boolean;
  fromCache: boolean;
  isError: boolean;
  online: boolean;
}): string | null {
  if (!state.hasContent) return null;
  if (!cataloguePresentation({ count: 1, hasData: true, ...state }).stale) return null;
  return state.online ? copy.offline.stale : copy.offline.banner;
}
