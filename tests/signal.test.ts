import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getJson } from "../src/api/client.ts";
import { JOBS_LIST_QUERY, endpoints } from "../src/api/endpoints.ts";
import { createRequestSignal } from "../src/api/signal.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jobsUrl = `${endpoints.jobs}?${JOBS_LIST_QUERY}`;

type TimeoutHandle = ReturnType<typeof setTimeout>;

function hideAbortSignalStatics(): () => void {
  const timeout = Object.getOwnPropertyDescriptor(AbortSignal, "timeout");
  const any = Object.getOwnPropertyDescriptor(AbortSignal, "any");
  Object.defineProperty(AbortSignal, "timeout", {
    configurable: true,
    writable: true,
    value: undefined,
  });
  Object.defineProperty(AbortSignal, "any", {
    configurable: true,
    writable: true,
    value: undefined,
  });
  return () => {
    if (timeout) Object.defineProperty(AbortSignal, "timeout", timeout);
    else delete (AbortSignal as { timeout?: unknown }).timeout;
    if (any) Object.defineProperty(AbortSignal, "any", any);
    else delete (AbortSignal as { any?: unknown }).any;
  };
}

function trackTimers(): { pending: Set<TimeoutHandle>; restore: () => void } {
  const pending = new Set<TimeoutHandle>();
  const originalSet = globalThis.setTimeout;
  const originalClear = globalThis.clearTimeout;
  globalThis.setTimeout = ((fn: TimerHandler, ms?: number, ...args: unknown[]) => {
    const id = originalSet(fn as (...raw: unknown[]) => void, ms, ...args);
    pending.add(id);
    return id;
  }) as typeof setTimeout;
  globalThis.clearTimeout = ((id?: TimeoutHandle) => {
    if (id !== undefined) pending.delete(id);
    originalClear(id);
  }) as typeof clearTimeout;
  return {
    pending,
    restore: () => {
      globalThis.setTimeout = originalSet;
      globalThis.clearTimeout = originalClear;
    },
  };
}

function abortableHang(): typeof fetch {
  return ((input: string | URL | Request, init?: RequestInit) =>
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

function okFetch(body: unknown): typeof fetch {
  return (async (_input: string | URL | Request, init?: RequestInit) => {
    if (init?.signal?.aborted) {
      const err = new Error("aborted");
      err.name = "AbortError";
      throw err;
    }
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}

function failingFetch(): typeof fetch {
  return (async () => {
    throw new TypeError("Failed to fetch");
  }) as typeof fetch;
}

test("src does not call AbortSignal.timeout or AbortSignal.any", () => {
  const signalSrc = readFileSync(join(root, "src/api/signal.ts"), "utf8");
  const clientSrc = readFileSync(join(root, "src/api/client.ts"), "utf8");
  const callTimeout = /AbortSignal\.timeout\s*\(/;
  const callAny = /AbortSignal\.any\s*\(/;
  assert.equal(callTimeout.test(signalSrc), false);
  assert.equal(callAny.test(signalSrc), false);
  assert.equal(callTimeout.test(clientSrc), false);
  assert.equal(callAny.test(clientSrc), false);
});

test("request without caller signal", async (t) => {
  const restoreStatics = hideAbortSignalStatics();
  const originalFetch = globalThis.fetch;
  const seen: AbortSignal[] = [];
  globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
    seen.push(init?.signal as AbortSignal);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
    restoreStatics();
  });

  assert.equal(typeof AbortSignal.timeout, "undefined");
  assert.equal(typeof AbortSignal.any, "undefined");
  const body = await getJson(jobsUrl);
  assert.deepEqual(body, { ok: true });
  assert.equal(seen.length, 1);
  assert.equal(seen[0] instanceof AbortSignal, true);
  assert.equal(seen[0]!.aborted, false);
});

test("caller cancellation", async (t) => {
  const restoreStatics = hideAbortSignalStatics();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = abortableHang();
  t.after(() => {
    globalThis.fetch = originalFetch;
    restoreStatics();
  });

  const user = new AbortController();
  const pending = getJson(jobsUrl, user.signal);
  user.abort();
  await assert.rejects(pending, (error: unknown) => {
    assert.equal((error as Error).name, "AbortError");
    return true;
  });
});

test("timeout cancellation", async (t) => {
  const restoreStatics = hideAbortSignalStatics();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = abortableHang();
  t.after(() => {
    globalThis.fetch = originalFetch;
    restoreStatics();
  });

  const started = Date.now();
  await assert.rejects(getJson(jobsUrl, undefined, 25), (error: unknown) => {
    assert.equal((error as Error).name, "TimeoutError");
    return true;
  });
  assert.ok(Date.now() - started < 1000);
});

test("successful request cleanup", async (t) => {
  const restoreStatics = hideAbortSignalStatics();
  const timers = trackTimers();
  const originalFetch = globalThis.fetch;
  const user = new AbortController();
  let removed = 0;
  const originalRemove = user.signal.removeEventListener.bind(user.signal);
  user.signal.removeEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => {
    if (type === "abort") removed += 1;
    return originalRemove(type, listener, options);
  }) as typeof user.signal.removeEventListener;
  globalThis.fetch = okFetch({ jobs: [] });
  t.after(() => {
    globalThis.fetch = originalFetch;
    timers.restore();
    restoreStatics();
  });

  await getJson(jobsUrl, user.signal, 5_000);
  assert.equal(timers.pending.size, 0);
  assert.ok(removed >= 1);
});

test("fetch/network failure cleanup", async (t) => {
  const restoreStatics = hideAbortSignalStatics();
  const timers = trackTimers();
  const originalFetch = globalThis.fetch;
  const user = new AbortController();
  let removed = 0;
  const originalRemove = user.signal.removeEventListener.bind(user.signal);
  user.signal.removeEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => {
    if (type === "abort") removed += 1;
    return originalRemove(type, listener, options);
  }) as typeof user.signal.removeEventListener;
  globalThis.fetch = failingFetch();
  t.after(() => {
    globalThis.fetch = originalFetch;
    timers.restore();
    restoreStatics();
  });

  await assert.rejects(getJson(jobsUrl, user.signal, 5_000), (error: unknown) => {
    assert.equal((error as Error).name, "TransportError");
    return true;
  });
  assert.equal(timers.pending.size, 0);
  assert.ok(removed >= 1);
});

test("createRequestSignal timeout does not use AbortSignal.timeout", async (t) => {
  const restoreStatics = hideAbortSignalStatics();
  t.after(restoreStatics);
  assert.equal(typeof AbortSignal.timeout, "undefined");
  const managed = createRequestSignal(undefined, 20);
  assert.equal(managed.signal.aborted, false);
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(managed.signal.aborted, true);
  managed.cleanup();
});
