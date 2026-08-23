import assert from "node:assert/strict";
import test from "node:test";
import { getJson } from "../src/api/client.ts";
import { JOBS_LIST_QUERY, endpoints } from "../src/api/endpoints.ts";
import { MalformedResponseError } from "../src/api/parse.ts";
import { REQUEST_TIMEOUT_MS, TimeoutError, TransportError } from "../src/api/signal.ts";
import { errorMessage } from "../src/copy/en.ts";

const jobsUrl = `${endpoints.jobs}?${JOBS_LIST_QUERY}`;

function abortableHang(): typeof fetch {
  return ((_input: string | URL | Request, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      const fail = () => {
        const err = new Error("aborted");
        err.name = "AbortError";
        reject(err);
      };
      if (init?.signal?.aborted) fail();
      else init?.signal?.addEventListener("abort", fail, { once: true });
    })) as typeof fetch;
}

test("request timeout is 45s", () => {
  assert.equal(REQUEST_TIMEOUT_MS, 45_000);
});

test("timeout classification", async (t) => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
    calls += 1;
    return abortableHang()(input, init);
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
  });

  await assert.rejects(getJson(jobsUrl, undefined, 20), (error: unknown) => {
    assert.equal(error instanceof TimeoutError, true);
    assert.equal((error as Error).name, "TimeoutError");
    assert.equal(errorMessage(error), "ReferTRM is taking longer than expected.");
    return true;
  });
  assert.equal(calls, 1);
});

test("transport retry occurs exactly once", async (t) => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    throw new TypeError("Failed to fetch");
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
  });

  await assert.rejects(getJson(jobsUrl), (error: unknown) => {
    assert.equal(error instanceof TransportError, true);
    assert.equal(errorMessage(error), "ReferTRM cannot connect on this network.");
    return true;
  });
  assert.equal(calls, 2);
});

test("transport then success uses the retry", async (t) => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    if (calls === 1) throw new TypeError("Network request failed");
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
  });

  assert.deepEqual(await getJson(jobsUrl), { ok: true });
  assert.equal(calls, 2);
});

test("no retry for HTTP errors", async (t) => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return new Response("no", { status: 503 });
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
  });

  await assert.rejects(getJson(jobsUrl), (error: unknown) => {
    assert.equal((error as Error).message, "refertrm_503");
    assert.equal(error instanceof TransportError, false);
    return true;
  });
  assert.equal(calls, 1);
});

test("no retry for malformed JSON response", async (t) => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return new Response("not-json", { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
  });

  await assert.rejects(getJson(jobsUrl), (error: unknown) => {
    assert.equal(error instanceof SyntaxError, true);
    assert.equal(error instanceof MalformedResponseError, false);
    return true;
  });
  assert.equal(calls, 1);
});

test("no retry for caller cancellation", async (t) => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
    calls += 1;
    return abortableHang()(input, init);
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
  });

  const user = new AbortController();
  const pending = getJson(jobsUrl, user.signal, 5_000);
  user.abort();
  await assert.rejects(pending, (error: unknown) => {
    assert.equal((error as Error).name, "AbortError");
    assert.equal(error instanceof TimeoutError, false);
    assert.equal(error instanceof TransportError, false);
    return true;
  });
  assert.equal(calls, 1);
});
