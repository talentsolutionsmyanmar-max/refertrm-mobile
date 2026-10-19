import assert from "node:assert/strict";
import { after, mock, test } from "node:test";
import { onlineManager, QueryClient } from "@tanstack/react-query";
import type { AcademyModuleDetail } from "../src/api/types";

// Only the native filesystem boundary is mocked. Loaders, HTTP, parsers, cache, and hydration stay real.
const files = new Map<string, string>();
mock.module("expo-file-system/legacy", {
  namedExports: {
    documentDirectory: "file:///catalogue-test/",
    getInfoAsync: async (uri: string) => ({ exists: files.has(uri) }),
    readAsStringAsync: async (uri: string) => {
      const value = files.get(uri);
      if (value === undefined) throw new Error("missing test file");
      return value;
    },
    writeAsStringAsync: async (uri: string, value: string) => {
      files.set(uri, value);
    },
    deleteAsync: async (uri: string) => {
      files.delete(uri);
    },
  },
});

type LoadApi = typeof import("../src/api/load");
type CatalogApi = typeof import("../src/cache/catalog");
type GenerationApi = typeof import("../src/cache/generation");
type KvApi = typeof import("../src/storage/kv");
type FileKvApi = typeof import("../src/storage/fileKv");
type SignalApi = typeof import("../src/api/signal");
type ParseApi = typeof import("../src/api/parse");

let loadJobs: LoadApi["loadJobs"];
let loadAcademy: LoadApi["loadAcademy"];
let loadJob: LoadApi["loadJob"];
let loadModule: LoadApi["loadModule"];
let catalog: CatalogApi["catalog"];
let resetGenerations: GenerationApi["resetGenerations"];
let getKv: KvApi["getKv"];
let resetMemoryKv: KvApi["resetMemoryKv"];
let persistCatalogToFile: FileKvApi["persistCatalogToFile"];
let TransportError: SignalApi["TransportError"];
let isAbortError: SignalApi["isAbortError"];
let parseJobsEnvelope: ParseApi["parseJobsEnvelope"];
let parseAcademyEnvelope: ParseApi["parseAcademyEnvelope"];

test.before(async () => {
  const loadApi = await import("../src/api/load");
  const catalogApi = await import("../src/cache/catalog");
  const generationApi = await import("../src/cache/generation");
  const kvApi = await import("../src/storage/kv");
  const fileKvApi = await import("../src/storage/fileKv");
  const signalApi = await import("../src/api/signal");
  const parseApi = await import("../src/api/parse");
  loadJobs = loadApi.loadJobs;
  loadAcademy = loadApi.loadAcademy;
  loadJob = loadApi.loadJob;
  loadModule = loadApi.loadModule;
  catalog = catalogApi.catalog;
  resetGenerations = generationApi.resetGenerations;
  getKv = kvApi.getKv;
  resetMemoryKv = kvApi.resetMemoryKv;
  persistCatalogToFile = fileKvApi.persistCatalogToFile;
  TransportError = signalApi.TransportError;
  isAbortError = signalApi.isAbortError;
  parseJobsEnvelope = parseApi.parseJobsEnvelope;
  parseAcademyEnvelope = parseApi.parseAcademyEnvelope;
});

const CACHE_KEY = "refertrm.p1.catalog.v1";
const FILE_URI = "file:///catalogue-test/refertrm.p1.catalog.v1.json";
const originalFetch = globalThis.fetch;

const job = (id: string) => ({
  id,
  slug: id,
  title: "Operations assistant",
  status: "active",
  company: { id: "qa-company", name: "Sample Company", tenantEnvironment: "production" },
});
const moduleRow = (id: string) => ({ id, slug: id, titleEn: "Working with a team", category: "Workplace" });

type Result = { ids: string[]; fromCache: boolean; syncedAt: number | null };
const lanes = [
  {
    name: "Jobs",
    envelope: (ids: string[]) => ({ jobs: ids.map(job) }),
    seed: (ids: string[]) => {
      catalog.writeJobs(parseJobsEnvelope({ jobs: ids.map(job) }));
    },
    load: async (signal?: AbortSignal): Promise<Result> => {
      const result = await loadJobs(signal);
      return { ...result, ids: result.jobs.map((row) => row.id) };
    },
    snapshotIds: () => catalog.snapshot().jobs.map((row) => row.id),
  },
  {
    name: "Academy",
    envelope: (ids: string[]) => ({ success: true, count: ids.length, modules: ids.map(moduleRow) }),
    seed: (ids: string[]) => {
      catalog.writeAcademy(parseAcademyEnvelope({ modules: ids.map(moduleRow) }));
    },
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
  globalThis.fetch = (async () => {
    throw new Error("unexpected unstubbed fetch");
  }) as typeof fetch;
}

function respond(payload: unknown): void {
  globalThis.fetch = (async () => new Response(JSON.stringify(payload), { status: 200 })) as typeof fetch;
}

async function persisted(lane: (typeof lanes)[number], ids: string[]): Promise<string> {
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
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function syntheticModule(id: string): AcademyModuleDetail {
  return {
    id,
    slug: id,
    titleEn: "Working with a team",
    titleMm: null,
    category: "Workplace",
    durationMinutes: 5,
    xpReward: 10,
    content: [{ type: "text", title: "Intro", content: "English lesson body" }],
    contentMm: null,
    mmContentReady: false,
    mmReady: false,
    isPublished: true,
    difficultyLevel: null,
    quizQuestions: null,
    quizQuestionsMm: null,
    learningObjectives: null,
    furtherReadingUrl: null,
    furtherReadingLabel: null,
    hookText: null,
    keyTakeaway: null,
    commonMistake: null,
    actionSteps: null,
    decisionScenario: null,
    hookTextMm: null,
    keyTakeawayMm: null,
    commonMistakeMm: null,
    actionStepsMm: null,
    decisionScenarioMm: null,
    vocabularyMm: null,
  };
}

after(() => {
  globalThis.fetch = originalFetch;
  resetMemoryKv();
  resetGenerations();
  files.clear();
  onlineManager.setOnline(true);
});

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
    globalThis.fetch = (async () => {
      throw new TypeError("Network request failed");
    }) as typeof fetch;
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
      globalThis.fetch = (async () => {
        calls += 1;
        throw new TypeError("Network request failed");
      }) as typeof fetch;
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
    await assert.rejects(
      () => lane.load(),
      (error: unknown) => error instanceof Error && error.name === "MalformedResponseError",
    );
    assert.equal(files.get(FILE_URI), bytes);
  });

  test(`${lane.name}: abort never falls back to even a usable persisted cache`, async () => {
    reset();
    const bytes = await persisted(lane, ["saved-record"]);
    const started = deferred<void>();
    globalThis.fetch = ((_url: unknown, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), {
          once: true,
        });
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
      if (calls === 1) {
        started.resolve();
        return olderResponse.promise;
      }
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

test("offline cold process hydrates saved job detail and lesson from disk without network", async () => {
  reset();
  const jobId = "saved-job-1";
  const lessonId = "saved-lesson-1";
  catalog.writeJobs(parseJobsEnvelope({ jobs: [job(jobId)] }));
  catalog.writeJobBody({
    id: jobId,
    description: "Cached job description for QA.",
    requirements: "Cached requirements.",
  });
  catalog.writeAcademy(parseAcademyEnvelope({ modules: [moduleRow(lessonId)] }));
  catalog.writeModule(syntheticModule(lessonId));
  await persistCatalogToFile();
  resetMemoryKv();
  assert.equal(getKv().getString(CACHE_KEY), undefined);

  globalThis.fetch = (async () => {
    throw new TypeError("Network request failed");
  }) as typeof fetch;

  const jobDetailOnly = await loadJob(jobId);
  assert.equal(jobDetailOnly.fromCache, true);
  assert.equal(jobDetailOnly.job.description, "Cached job description for QA.");

  const lessonOnly = await loadModule(lessonId);
  assert.equal(lessonOnly.fromCache, true);
  assert.equal(lessonOnly.module.content?.[0]?.content, "English lesson body");

  const jobs = await loadJobs();
  assert.deepEqual(jobs.jobs.map((row) => row.id), [jobId]);
  assert.equal(jobs.fromCache, true);

  const academy = await loadAcademy();
  assert.deepEqual(academy.modules.map((row) => row.id), [lessonId]);
  assert.equal(academy.fromCache, true);
});

test("offlineFirst QueryClient runs catalogue loaders while onlineManager reports offline", async () => {
  reset();
  catalog.writeJobs(parseJobsEnvelope({ jobs: [job("query-offline-job")] }));
  catalog.writeAcademy(parseAcademyEnvelope({ modules: [moduleRow("query-offline-lesson")] }));
  await persistCatalogToFile();
  resetMemoryKv();
  globalThis.fetch = (async () => {
    throw new TypeError("Network request failed");
  }) as typeof fetch;

  onlineManager.setOnline(false);
  const client = new QueryClient({
    defaultOptions: {
      queries: { networkMode: "offlineFirst", retry: false },
    },
  });
  try {
    const jobs = await client.fetchQuery({
      queryKey: ["jobs-offline-cold"],
      queryFn: ({ signal }) => loadJobs(signal),
    });
    assert.deepEqual(jobs.jobs.map((row) => row.id), ["query-offline-job"]);
    assert.equal(jobs.fromCache, true);

    const academy = await client.fetchQuery({
      queryKey: ["academy-offline-cold"],
      queryFn: ({ signal }) => loadAcademy(signal),
    });
    assert.deepEqual(academy.modules.map((row) => row.id), ["query-offline-lesson"]);
    assert.equal(academy.fromCache, true);
  } finally {
    client.clear();
    onlineManager.setOnline(true);
  }
});
