export const TAB_ROUTES = ["home", "jobs", "learn", "earn", "me"] as const;

export type TabRoute = (typeof TAB_ROUTES)[number];

const TAB_SET = new Set<string>(TAB_ROUTES);

export function isTabRoute(value: string): value is TabRoute {
  return TAB_SET.has(value);
}

export function tabHref(tab: TabRoute): `/${TabRoute}` {
  return `/${tab}`;
}