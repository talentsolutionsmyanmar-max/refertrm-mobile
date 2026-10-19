import { copy } from "../copy/en";

/** Keep unavailable catalogue state distinct from a successful empty result. */
export function cataloguePresentation(state: {
  count: number;
  hasData: boolean;
  fromCache: boolean;
  isError: boolean;
  online: boolean;
}) {
  const stale = state.fromCache || state.isError || !state.online;
  return {
    stale,
    showCount: state.hasData && (!stale || state.count > 0),
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
