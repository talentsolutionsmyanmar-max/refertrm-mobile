import { parseRouteSegment } from "../linking/ids";
import { endpoints, JOBS_LIST_QUERY } from "./endpoints";
import {
  AbortedError,
  createRequestSignal,
  isAbortError,
  isNativeTransportFailure,
  REQUEST_TIMEOUT_MS,
  throwIfAborted,
  TimeoutError,
  TransportError,
} from "./signal";

function publicHeaders(): HeadersInit {
  return { Accept: "application/json" };
}

function classifyFetchError(error: unknown, user: AbortSignal | undefined, timedOut: boolean): never {
  if (user?.aborted) throw new AbortedError();
  if (timedOut) throw new TimeoutError();
  if (isAbortError(error)) throw new AbortedError();
  if (isNativeTransportFailure(error)) throw new TransportError(error);
  throw error;
}

async function getJsonOnce(
  url: string,
  signal?: AbortSignal,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<unknown> {
  throwIfAborted(signal);
  const request = createRequestSignal(signal, timeoutMs);
  try {
    const res = await fetch(url, {
      headers: publicHeaders(),
      signal: request.signal,
    });
    throwIfAborted(signal);
    if (!res.ok) throw new Error(`refertrm_${res.status}`);
    return await res.json();
  } catch (error) {
    classifyFetchError(error, signal, request.timedOut());
  } finally {
    request.cleanup();
  }
}

export async function getJson(
  url: string,
  signal?: AbortSignal,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<unknown> {
  try {
    return await getJsonOnce(url, signal, timeoutMs);
  } catch (error) {
    if (error instanceof TransportError && !signal?.aborted) {
      throwIfAborted(signal);
      return await getJsonOnce(url, signal, timeoutMs);
    }
    throw error;
  }
}

export function fetchJobs(signal?: AbortSignal): Promise<unknown> {
  return getJson(`${endpoints.jobs}?${JOBS_LIST_QUERY}`, signal);
}

export function fetchJob(id: string, signal?: AbortSignal): Promise<unknown> {
  const safe = parseRouteSegment(id);
  if (!safe) return Promise.reject(new Error("invalid_id"));
  return getJson(endpoints.job(encodeURIComponent(safe)), signal);
}

export function fetchAcademy(signal?: AbortSignal): Promise<unknown> {
  return getJson(endpoints.academyPublic, signal);
}

export function fetchModule(id: string, signal?: AbortSignal): Promise<unknown> {
  const safe = parseRouteSegment(id);
  if (!safe) return Promise.reject(new Error("invalid_id"));
  return getJson(endpoints.academyModule(encodeURIComponent(safe)), signal);
}
