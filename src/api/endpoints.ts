/** Live ReferTRM HTTP surface. P1 uses the public GETs only. */

export const API_BASE = "https://www.refertrm.com";

export const endpoints = {
  jobs: `${API_BASE}/api/jobs`,
  job: (id: string) => `${API_BASE}/api/jobs/${id}`,
  academyPublic: `${API_BASE}/api/academy/public`,
  academyModule: (id: string) => `${API_BASE}/api/academy/modules/${id}`,
} as const;

/** Server default is 50. 500 returns the full eligible public set. view=summary omits bodies. */
export const JOBS_LIST_QUERY = "status=active&limit=500&view=summary";

/** G2 — Home hero: one role only, the same summary projection. */
export const HERO_JOB_QUERY = "status=active&limit=1&view=summary";

/** G2 — the hero's visible loading state never outlives the ten-second Mother-Test budget. */
export const HERO_TIMEOUT_MS = 8_000;

export const laterEndpoints = {
  apply: `${API_BASE}/api/apply`,
  me: `${API_BASE}/api/user/me`,
} as const;
