/** Live ReferTRM HTTP surface. P1 uses the three public GETs only. */

export const API_BASE = "https://www.refertrm.com";

export const endpoints = {
  jobs: `${API_BASE}/api/jobs`,
  academyPublic: `${API_BASE}/api/academy/public`,
  academyModule: (id: string) => `${API_BASE}/api/academy/modules/${id}`,
} as const;

/** Server default is 50. 500 returns the full eligible public set (214 on 2026-08-21). Do not hardcode the count. */
export const JOBS_LIST_QUERY = "status=active&limit=500";

export const laterEndpoints = {
  apply: `${API_BASE}/api/apply`,
  me: `${API_BASE}/api/user/me`,
} as const;
