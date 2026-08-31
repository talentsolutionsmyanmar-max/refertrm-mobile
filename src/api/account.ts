import { clearAccessToken, getAccessToken } from "../auth/session";
import { AuthRequiredError, HttpError } from "./errors";
import { laterEndpoints } from "./endpoints";
import { createRequestSignal, REQUEST_TIMEOUT_MS, throwIfAborted } from "./signal";

export type UserProfile = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  referralCode?: string | null;
  subscriptionTier?: string | null;
  points?: number | null;
  totalReferrals?: number | null;
  successfulReferrals?: number | null;
};

export type ApplicationSummary = {
  id: string;
  job_id?: string | null;
  job_title?: string | null;
  company?: string | null;
  status?: string | null;
  created_at?: string | null;
};

export type ApplyInput = {
  jobId: string;
  candidateName?: string;
  phone?: string;
  email?: string;
  coverNote?: string;
  referralCode?: string;
};

export type ApplyResult = {
  applicationId: string;
  status: "submitted";
  jobTitle?: string;
  company?: string;
};

function errorCode(payload: unknown, status: number): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const value = (payload as { error?: unknown }).error;
    if (typeof value === "string" && value.trim()) return value;
  }
  return `http_${status}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function invalidResponse(payload: unknown): HttpError {
  return new HttpError(502, "invalid_response", payload);
}

function parseUserProfile(payload: unknown): UserProfile {
  if (!isRecord(payload) || !isNonEmptyString(payload.id)) throw invalidResponse(payload);
  return payload as UserProfile;
}

function parseApplications(payload: unknown): ApplicationSummary[] {
  if (!isRecord(payload) || !Array.isArray(payload.applications)) throw invalidResponse(payload);
  if (!payload.applications.every((row) => isRecord(row) && isNonEmptyString(row.id))) {
    throw invalidResponse(payload);
  }
  return payload.applications as ApplicationSummary[];
}

function parseApplyResult(payload: unknown): ApplyResult {
  if (
    !isRecord(payload)
    || !isNonEmptyString(payload.applicationId)
    || payload.status !== "submitted"
  ) {
    throw invalidResponse(payload);
  }
  return payload as ApplyResult;
}

async function authenticatedJson<T>(
  url: string,
  init: RequestInit = {},
  signal?: AbortSignal,
  parse?: (payload: unknown) => T,
): Promise<T> {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new AuthRequiredError();

  throwIfAborted(signal);
  const request = createRequestSignal(signal, REQUEST_TIMEOUT_MS);
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${accessToken}`);
  try {
    const response = await fetch(url, { ...init, headers, signal: request.signal });
    throwIfAborted(signal);
    const payload = await response.json().catch(() => null) as unknown;
    if (response.status === 401) {
      await clearAccessToken();
      throw new AuthRequiredError(payload);
    }
    if (!response.ok) throw new HttpError(response.status, errorCode(payload, response.status), payload);
    if (!parse) throw invalidResponse(payload);
    return parse(payload);
  } finally {
    request.cleanup();
  }
}

export function fetchMe(signal?: AbortSignal): Promise<UserProfile> {
  return authenticatedJson<UserProfile>(laterEndpoints.me, {}, signal, parseUserProfile);
}

export function fetchApplications(signal?: AbortSignal): Promise<ApplicationSummary[]> {
  return authenticatedJson<ApplicationSummary[]>(laterEndpoints.apply, {}, signal, parseApplications);
}

export function submitApplication(input: ApplyInput, signal?: AbortSignal): Promise<ApplyResult> {
  return authenticatedJson<ApplyResult>(
    laterEndpoints.apply,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    signal,
    parseApplyResult,
  );
}
