import { parseRouteSegment } from "../linking/ids";
import { getAccessToken } from "../auth/session";
import { endpoints, JOBS_LIST_QUERY } from "./endpoints";
import { mergeSignals, throwIfAborted } from "./signal";

function headers(): HeadersInit {
  const token = getAccessToken();
  const base: Record<string, string> = { Accept: "application/json" };
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
}

export async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  throwIfAborted(signal);
  const res = await fetch(url, {
    headers: headers(),
    signal: mergeSignals(signal),
  });
  throwIfAborted(signal);
  if (!res.ok) throw new Error(`refertrm_${res.status}`);
  return await res.json();
}

export function fetchJobs(signal?: AbortSignal): Promise<unknown> {
  return getJson(`${endpoints.jobs}?${JOBS_LIST_QUERY}`, signal);
}

export function fetchAcademy(signal?: AbortSignal): Promise<unknown> {
  return getJson(endpoints.academyPublic, signal);
}

export function fetchModule(id: string, signal?: AbortSignal): Promise<unknown> {
  const safe = parseRouteSegment(id);
  if (!safe) return Promise.reject(new Error("invalid_id"));
  return getJson(endpoints.academyModule(encodeURIComponent(safe)), signal);
}
