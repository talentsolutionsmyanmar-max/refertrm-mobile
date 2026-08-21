import { getAccessToken } from "../auth/session";
import { endpoints, JOBS_LIST_QUERY } from "./endpoints";
import type { AcademyModuleResponse, AcademyPublicResponse, JobsResponse } from "./types";

const TIMEOUT_MS = 20_000;

function headers(): HeadersInit {
  const token = getAccessToken();
  const base: Record<string, string> = { Accept: "application/json" };
  // P1 token is always null. Do not send an empty Authorization header.
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: headers(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`refertrm_${res.status}`);
  return (await res.json()) as T;
}

export function fetchJobs(): Promise<JobsResponse> {
  return getJson(`${endpoints.jobs}?${JOBS_LIST_QUERY}`);
}

export function fetchAcademy(): Promise<AcademyPublicResponse> {
  return getJson(endpoints.academyPublic);
}

export function fetchModule(id: string): Promise<AcademyModuleResponse> {
  const safe = id.trim().slice(0, 120);
  if (!safe) return Promise.reject(new Error("missing_id"));
  return getJson(endpoints.academyModule(encodeURIComponent(safe)));
}
