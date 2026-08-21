import { getAccessToken } from "../auth/session";
import { endpoints, JOBS_LIST_QUERY } from "./endpoints";
import type { AcademyModuleResponse, AcademyPublicResponse, JobsResponse } from "./types";

function headers(): HeadersInit {
  const token = getAccessToken();
  const base: Record<string, string> = { Accept: "application/json" };
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: headers() });
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
  return getJson(endpoints.academyModule(id));
}
