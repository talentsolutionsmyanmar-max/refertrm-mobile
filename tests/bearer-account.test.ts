import assert from "node:assert/strict";
import test from "node:test";
import { fetchApplications, fetchMe, submitApplication } from "../src/api/account.ts";
import { fetchJobs } from "../src/api/client.ts";
import { AuthRequiredError, HttpError } from "../src/api/errors.ts";
import { configureSecureSessionStorage, saveAccessToken, type SecureSessionStorage } from "../src/auth/session.ts";

function sessionStore(token: string | null): SecureSessionStorage {
  let value = token;
  return {
    getItemAsync: async () => value,
    setItemAsync: async (_key, next) => {
      value = next;
    },
    deleteItemAsync: async () => {
      value = null;
    },
  };
}

test("private profile and application requests attach the secure Bearer token", async (t) => {
  configureSecureSessionStorage(sessionStore("mobile-access-token"));
  const original = globalThis.fetch;
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    if (String(input).endsWith("/api/user/me")) return Response.json({ id: "u-1", name: "Ko" });
    if (init?.method === "POST") return Response.json({ applicationId: "a-1", status: "submitted" });
    return Response.json({ applications: [] });
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
  });

  await fetchMe();
  await fetchApplications();
  await submitApplication({ jobId: "job-1" });

  assert.equal(calls.length, 3);
  for (const call of calls) {
    assert.equal(new Headers(call.init?.headers).get("Authorization"), "Bearer mobile-access-token");
  }
  assert.equal(calls[2]?.init?.method, "POST");
  assert.equal(new Headers(calls[2]?.init?.headers).get("Content-Type"), "application/json");
  assert.deepEqual(JSON.parse(String(calls[2]?.init?.body)), { jobId: "job-1" });
});

test("private requests fail before fetch when no secure session exists", async (t) => {
  configureSecureSessionStorage(sessionStore(null));
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return Response.json({});
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
  });

  await assert.rejects(fetchMe(), AuthRequiredError);
  await assert.rejects(fetchApplications(), AuthRequiredError);
  await assert.rejects(submitApplication({ jobId: "job-1" }), AuthRequiredError);
  assert.equal(calls, 0);
});

test("an invalid server session is cleared and reported as auth required", async (t) => {
  const store = sessionStore("expired-token");
  configureSecureSessionStorage(store);
  const original = globalThis.fetch;
  globalThis.fetch = (async () => Response.json({ error: "unauthorized" }, { status: 401 })) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
  });

  await assert.rejects(fetchMe(), AuthRequiredError);
  await assert.rejects(fetchMe(), AuthRequiredError);
});

test("application conflict and rate limit remain distinguishable", async (t) => {
  configureSecureSessionStorage(sessionStore("mobile-access-token"));
  const original = globalThis.fetch;
  let status = 409;
  globalThis.fetch = (async () => Response.json({ error: status === 409 ? "JOB_INACTIVE" : "rate_limit" }, { status })) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
  });

  await assert.rejects(submitApplication({ jobId: "job-1" }), (error: unknown) => {
    assert.equal(error instanceof HttpError, true);
    assert.equal((error as HttpError).status, 409);
    assert.equal((error as HttpError).code, "JOB_INACTIVE");
    return true;
  });

  status = 429;
  await assert.rejects(submitApplication({ jobId: "job-1" }), (error: unknown) => {
    assert.equal(error instanceof HttpError, true);
    assert.equal((error as HttpError).status, 429);
    assert.equal((error as HttpError).code, "rate_limit");
    return true;
  });
});

test("malformed 2xx profile response enters a degraded error state", async (t) => {
  configureSecureSessionStorage(sessionStore("mobile-access-token"));
  const original = globalThis.fetch;
  globalThis.fetch = (async () => Response.json({})) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
  });

  await assert.rejects(fetchMe(), (error: unknown) => {
    assert.equal(error instanceof HttpError, true);
    assert.equal((error as HttpError).status, 502);
    assert.equal((error as HttpError).code, "invalid_response");
    return true;
  });
});

test("malformed 2xx applications response never invents an empty result", async (t) => {
  configureSecureSessionStorage(sessionStore("mobile-access-token"));
  const original = globalThis.fetch;
  let payload: unknown = {};
  globalThis.fetch = (async () => Response.json(payload)) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
  });

  await assert.rejects(fetchApplications(), (error: unknown) => {
    assert.equal(error instanceof HttpError, true);
    assert.equal((error as HttpError).code, "invalid_response");
    return true;
  });

  payload = { applications: [{}] };
  await assert.rejects(fetchApplications(), (error: unknown) => {
    assert.equal(error instanceof HttpError, true);
    assert.equal((error as HttpError).code, "invalid_response");
    return true;
  });
});

test("malformed 2xx Apply response never reports a submission", async (t) => {
  configureSecureSessionStorage(sessionStore("mobile-access-token"));
  const original = globalThis.fetch;
  globalThis.fetch = (async () => Response.json({})) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
  });

  await assert.rejects(submitApplication({ jobId: "job-1" }), (error: unknown) => {
    assert.equal(error instanceof HttpError, true);
    assert.equal((error as HttpError).status, 502);
    assert.equal((error as HttpError).code, "invalid_response");
    return true;
  });
});

test("public Jobs requests never receive the private Bearer token", async (t) => {
  configureSecureSessionStorage(sessionStore("mobile-access-token"));
  const original = globalThis.fetch;
  let authorization: string | null = "not-called";
  globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
    authorization = new Headers(init?.headers).get("Authorization");
    return Response.json({ jobs: [] });
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
  });

  await fetchJobs();
  assert.equal(authorization, null);
});
