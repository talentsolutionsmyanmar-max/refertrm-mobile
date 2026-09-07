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
