/** Live ReferTRM HTTP surface. Public and account routes use the canonical origin. */

export const ACCOUNT_API_BASE = "https://www.refertrm.com";
export const PUBLIC_API_BASE = ACCOUNT_API_BASE;

export const endpoints = {
  jobs: `${PUBLIC_API_BASE}/api/jobs`,
  job: (id: string) => `${PUBLIC_API_BASE}/api/jobs/${id}`,
  academyPublic: `${PUBLIC_API_BASE}/api/academy/public`,
  academyModule: (id: string) => `${PUBLIC_API_BASE}/api/academy/modules/${id}`,
} as const;

/** Server default is 50. 500 returns the full eligible public set. view=summary omits bodies. */
export const JOBS_LIST_QUERY = "status=active&limit=500&view=summary";

export const laterEndpoints = {
  apply: `${ACCOUNT_API_BASE}/api/apply`,
  me: `${ACCOUNT_API_BASE}/api/user/me`,
} as const;
