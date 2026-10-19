import assert from "node:assert/strict";

// Run with Bun: only the native filesystem boundary is replaced. The real
// loaders, HTTP client, parsers, sanitizer, cache and file hydration all execute.
// A dynamic builtin name avoids adding Bun-only types to the app's dependencies.
const runnerModule = "bun:test";
const { mock, test, afterAll } = await import(runnerModule) as {
  mock: { module: (name: string, factory: () => Record<string, unknown>) => void };
  test: (name: string, body: () => Promise<void>) => void;
  afterAll: (body: () => void) => void;
};
const files = new Map<string, string>();
mock.module("expo-file-system/legacy", () => ({
  documentDirectory: "file:///catalogue-test/",
  getInfoAsync: async (uri: string) => ({ exists: files.has(uri) }),
  readAsStringAsync: async (uri: string) => {
    const value = files.get(uri);
    if (value === undefined) throw new Error("missing test file");
    return value;
  },
  writeAsStringAsync: async (uri: string, value: string) => { files.set(uri, value); },
  deleteAsync: async (uri: string) => { files.delete(uri); },
}));

const { loadJobs, loadAcademy } = await import("../src/api/load");
const { catalog } = await import("../src/cache/catalog");
const { resetGenerations } = await import("../src/cache/generation");
const { getKv, resetMemoryKv } = await import("../src/storage/kv");
const { persistCatalogToFile } = await import("../src/storage/fileKv");
const { TransportError, isAbortError } = await import("../src/api/signal");
const { parseJobsEnvelope, parseAcademyEnvelope } = await import("../src/api/parse");

const CACHE_KEY = "refertrm.p1.catalog.v1";
const FILE_URI = "file:///catalogue-test/refertrm.p1.catalog.v1.json";
const originalFetch = globalThis.fetch;
const job = (id: string) => ({
  id, slug: id, title: "Operations assistant", status: "active",
  company: { id: "qa-company", name: "Sample Company", tenantEnvironment: "production" },
});
const moduleRow = (id: string) => ({ id, slug: id, titleEn: "Working with a team", category: "Workplace" });
type Result = { ids: string[]; fromCache: boolean; syncedAt: number | null };
const lanes = [
  {
    name: "Jobs",
    envelope: (ids: string[]) => ({ jobs: ids.map(job) }),
    seed: (ids: string[]) => { catalog.writeJobs(parseJobsEnvelope({ jobs: ids.map(job) })); },
    load: async (signal?: AbortSignal): Promise<Result> => {
      const result = await loadJobs(signal);
      return { ...result, ids: result.jobs.map((row) => row.id) };
    },
    snapshotIds: () => catalog.snapshot().jobs.map((row) => row.id),
  },
  {
    name: "Academy",
    envelope: (ids: string[]) => ({ success: true, count: ids.length, modules: ids.map(moduleRow) }),
    seed: (ids: string[]) => { catalog.writeAcademy(parseAcademyEnvelope({ modules: ids.map(moduleRow) })); },
    load: async (signal?: AbortSignal): Promise<Result> => {
      const result = await loadAcademy(signal);
      return { ...result, ids: result.modules.map((row) => row.id) };
    },
    snapshotIds: () => catalog.snapshot().modules.map((row) => row.id),
  },
];

function reset(): void {
  files.clear();
  resetMemoryKv();
  resetGenerations();
  // Every scenario replaces fetch before a loader can issue a request.
  globalThis.fetch = (async () => { throw new Error("unexpected unstubbed fetch"); }) as typeof fetch;
}

function respond(payload: unknown): void {
  globalThis.fetch = (async () => new Response(JSON.stringify(payload), { status: 200 })) as typeof fetch;
}

async function persisted(lane: typeof lanes[number], ids: string[]): Promise<string> {
  lane.seed(ids);
  await persistCatalogToFile();
  const bytes = files.get(FILE_URI);
  assert.ok(bytes, "the real persistence function must write the native filesystem boundary");
  resetMemoryKv();
  assert.equal(getKv().getString(CACHE_KEY), undefined, "simulate a cold process before real hydration");
  return bytes;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

afterAll(() => { globalThis.fetch = originalFetch; resetMemoryKv(); resetGenerations(); files.clear(); });
  for (const lane of lanes) {
    test(`${lane.name}: live nonempty success persists and hydrates after restart`, async () => {
      reset();
      respond(lane.envelope(["record-a"]));
      const live = await lane.load();
      assert.deepEqual(live.ids, ["record-a"]);
      assert.equal(live.fromCache, false);
      assert.equal(typeof live.syncedAt, "number");
      await persistCatalogToFile();
      resetMemoryKv();
      globalThis.fetch = (async () => { throw new TypeError("Network request failed"); }) as typeof fetch;
      const stale = await lane.load();
      assert.deepEqual(stale.ids, ["record-a"]);
      assert.equal(stale.fromCache, true);
    });

    test(`${lane.name}: live empty is authoritative and replaces a nonempty cache`, async () => {
      reset();
      await persisted(lane, ["old-record"]);
      respond(lane.envelope([]));
      const empty = await lane.load();
      assert.deepEqual(empty.ids, []);
      assert.equal(empty.fromCache, false);
      assert.equal(typeof empty.syncedAt, "number");
      assert.deepEqual(lane.snapshotIds(), []);
    });

    for (const cachedIds of [undefined, []] as const) {
      test(`${lane.name}: transport failure with ${cachedIds ? "persisted empty" : "absent"} cache rejects`, async () => {
        reset();
        const bytes = cachedIds ? await persisted(lane, []) : undefined;
        let calls = 0;
        globalThis.fetch = (async () => { calls += 1; throw new TypeError("Network request failed"); }) as typeof fetch;
        await assert.rejects(() => lane.load(), (error: unknown) => error instanceof TransportError);
        assert.equal(calls, 1, "list transport failure must not silently retry");
        assert.equal(files.get(FILE_URI), bytes, "failure must preserve persisted bytes");
      });
    }

    test(`${lane.name}: HTTP failure after persisted empty rejects without replacing bytes`, async () => {
      reset();
      const bytes = await persisted(lane, []);
      globalThis.fetch = (async () => new Response("unavailable", { status: 503 })) as typeof fetch;
      await assert.rejects(() => lane.load(), /refertrm_503/);
      assert.equal(files.get(FILE_URI), bytes);
    });

    test(`${lane.name}: malformed 200 after persisted empty is not a successful empty result`, async () => {
      reset();
      const bytes = await persisted(lane, []);
      respond({});
      await assert.rejects(() => lane.load(), (error: unknown) => error instanceof Error && error.name === "MalformedResponseError");
      assert.equal(files.get(FILE_URI), bytes);
    });

    test(`${lane.name}: abort never falls back to even a usable persisted cache`, async () => {
      reset();
      const bytes = await persisted(lane, ["saved-record"]);
      const started = deferred<void>();
      globalThis.fetch = ((_url: unknown, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
        started.resolve();
      })) as typeof fetch;
      const controller = new AbortController();
      const loading = lane.load(controller.signal);
      const rejected = assert.rejects(loading, isAbortError);
      await started.promise;
      controller.abort();
      await rejected;
      assert.equal(files.get(FILE_URI), bytes);
      assert.deepEqual(lane.snapshotIds(), ["saved-record"]);
    });

    test(`${lane.name}: late older success cannot replace the newer successful result`, async () => {
      reset();
      const started = deferred<void>();
      const olderResponse = deferred<Response>();
      let calls = 0;
      globalThis.fetch = (async () => {
        calls += 1;
        if (calls === 1) { started.resolve(); return olderResponse.promise; }
        return new Response(JSON.stringify(lane.envelope(["newer-record"])), { status: 200 });
      }) as typeof fetch;
      const older = lane.load();
      await started.promise;
      const newer = await lane.load();
      olderResponse.resolve(new Response(JSON.stringify(lane.envelope(["older-record"])), { status: 200 }));
      const late = await older;
      assert.deepEqual(newer.ids, ["newer-record"]);
      assert.deepEqual(late.ids, ["newer-record"]);
      assert.deepEqual(lane.snapshotIds(), ["newer-record"]);
    });
  }
