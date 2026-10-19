import assert from "node:assert/strict";
import { after, mock, test } from "node:test";
import { onlineManager } from "@tanstack/react-query";
import { endpoints, JOBS_LIST_QUERY } from "../src/api/endpoints";
import { createAppQueryClient } from "../src/query/client";
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
    moveAsync: async ({ from, to }: { from: string; to: string }) => {
      const value = files.get(from);
      if (value === undefined) throw new Error(`missing tmp file ${from}`);
      files.set(to, value);
      files.delete(from);
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
let flushScheduledCatalogPersist: FileKvApi["flushScheduledCatalogPersist"];
let resetHydrateCatalogForTests: FileKvApi["resetHydrateCatalogForTests"];
let resetCatalogPersistForTests: FileKvApi["resetCatalogPersistForTests"];
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
  flushScheduledCatalogPersist = fileKvApi.flushScheduledCatalogPersist;
  resetHydrateCatalogForTests = fileKvApi.resetHydrateCatalogForTests;
  resetCatalogPersistForTests = fileKvApi.resetCatalogPersistForTests;
  TransportError = signalApi.TransportError;
  isAbortError = signalApi.isAbortError;
  parseJobsEnvelope = parseApi.parseJobsEnvelope;
  parseAcademyEnvelope = parseApi.parseAcademyEnvelope;
});

const CACHE_KEY = "refertrm.p1.catalog.v1";
const FILE_URI = "file:///catalogue-test/refertrm.p1.catalog.v1.json";
const JOB_BODY_DESCRIPTION = "Persisted job description for cold offline QA.";
const LESSON_BODY_CONTENT = "English lesson body";
const originalFetch = globalThis.fetch;

type DiskCatalogue = {
  jobBodies?: Record<string, { description: string | null }>;
  moduleBodies?: Record<string, { content?: Array<{ content?: string }> }>;
};

function assertCatalogueFileOnDisk(): void {
  assert.ok(files.has(FILE_URI), "catalogue file must exist on disk");
}

function readCatalogueOnDisk(): DiskCatalogue {
  assertCatalogueFileOnDisk();
  return JSON.parse(files.get(FILE_URI)!) as DiskCatalogue;
}

function assertListFlushHasNoBodies(jobId: string, lessonId: string): void {
  const disk = readCatalogueOnDisk();
  assert.equal(disk.jobBodies?.[jobId], undefined, "list flush must not persist job bodies");
  assert.equal(disk.moduleBodies?.[lessonId], undefined, "list flush must not persist module bodies");
}

function assertJobBodyOnDisk(jobId: string): void {
  assert.equal(readCatalogueOnDisk().jobBodies?.[jobId]?.description, JOB_BODY_DESCRIPTION);
}

function assertModuleBodyAbsentOnDisk(lessonId: string): void {
  assert.equal(readCatalogueOnDisk().moduleBodies?.[lessonId], undefined);
}

function assertModuleBodyOnDisk(lessonId: string): void {
  assert.equal(readCatalogueOnDisk().moduleBodies?.[lessonId]?.content?.[0]?.content, LESSON_BODY_CONTENT);
}

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
  resetHydrateCatalogForTests();
  resetCatalogPersistForTests();
  globalThis.fetch = (async () => {
    throw new Error("unexpected unstubbed fetch");
  }) as typeof fetch;
}

function simulateProcessRestart(): void {
  resetMemoryKv();
  resetGenerations();
  resetHydrateCatalogForTests();
  resetCatalogPersistForTests();
  assert.equal(getKv().getString(CACHE_KEY), undefined, "cold memory after restart");
  assert.ok(files.get(FILE_URI), "catalogue file must survive restart");
}

function jobDetailPayload(id: string) {
  return {
    job: {
      ...job(id),
      companyId: "qa-company",
      createdAt: "2026-01-01T00:00:00.000Z",
      description: JOB_BODY_DESCRIPTION,
      requirements: "Persisted requirements.",
      urgent: false,
      featured: false,
    },
  };
}

function moduleDetailPayload(id: string) {
  return { module: syntheticModule(id) };
}

function mountOnlineCatalogueFetch(jobId: string, lessonId: string): void {
  const jobsListUrl = `${endpoints.jobs}?${JOBS_LIST_QUERY}`;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
    if (url === jobsListUrl) {
      return new Response(JSON.stringify({ jobs: [job(jobId)] }));
    }
    if (url === endpoints.job(jobId)) {
      return new Response(JSON.stringify(jobDetailPayload(jobId)));
    }
    if (url === endpoints.academyPublic) {
      return new Response(JSON.stringify({ success: true, count: 1, modules: [moduleRow(lessonId)] }));
    }
    if (url === endpoints.academyModule(lessonId)) {
      return new Response(JSON.stringify(moduleDetailPayload(lessonId)));
    }
    throw new Error(`unexpected fetch ${url}`);
  }) as typeof fetch;
}

function offlineFetch(): void {
  globalThis.fetch = (async () => {
    throw new TypeError("Network request failed");
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

test("flushScheduledCatalogPersist writes nothing when no persist timer is pending", async () => {
  reset();
  catalog.writeJobs(parseJobsEnvelope({ jobs: [job("memory-only-job")] }));
  assert.ok(getKv().getString(CACHE_KEY), "seed catalogue in memory without scheduling disk persist");
  assert.equal(files.has(FILE_URI), false);
  await flushScheduledCatalogPersist();
  assert.equal(files.has(FILE_URI), false, "flush must not write disk without a scheduled timer");
});

test("offline cold process hydrates job and lesson bodies after online loaders persisted them", async () => {
  reset();
  const jobId = "saved-job-1";
  const lessonId = "saved-lesson-1";
  mountOnlineCatalogueFetch(jobId, lessonId);

  const listed = await loadJobs();
  assert.equal(listed.fromCache, false);
  assert.deepEqual(listed.jobs.map((row) => row.id), [jobId]);

  const listedAcademy = await loadAcademy();
  assert.equal(listedAcademy.fromCache, false);
  assert.deepEqual(listedAcademy.modules.map((row) => row.id), [lessonId]);

  await flushScheduledCatalogPersist();
  assertListFlushHasNoBodies(jobId, lessonId);

  const liveJob = await loadJob(jobId);
  assert.equal(liveJob.fromCache, false);
  assert.equal(liveJob.job.description, JOB_BODY_DESCRIPTION);
  await flushScheduledCatalogPersist();
  assertJobBodyOnDisk(jobId);
  assertModuleBodyAbsentOnDisk(lessonId);

  const liveLesson = await loadModule(lessonId);
  assert.equal(liveLesson.fromCache, false);
  assert.equal(liveLesson.module.content?.[0]?.content, LESSON_BODY_CONTENT);
  await flushScheduledCatalogPersist();
  assertModuleBodyOnDisk(lessonId);

  simulateProcessRestart();
  offlineFetch();

  const coldJob = await loadJob(jobId);
  assert.equal(coldJob.fromCache, true);
  assert.equal(coldJob.job.description, JOB_BODY_DESCRIPTION);

  const coldLesson = await loadModule(lessonId);
  assert.equal(coldLesson.fromCache, true);
  assert.equal(coldLesson.module.content?.[0]?.content, LESSON_BODY_CONTENT);

  const coldJobs = await loadJobs();
  assert.deepEqual(coldJobs.jobs.map((row) => row.id), [jobId]);
  assert.equal(coldJobs.fromCache, true);

  const coldAcademy = await loadAcademy();
  assert.deepEqual(coldAcademy.modules.map((row) => row.id), [lessonId]);
  assert.equal(coldAcademy.fromCache, true);
});

test("offlineFirst QueryClient runs catalogue loaders while onlineManager reports offline", async () => {
  reset();
  const jobId = "query-offline-job";
  const lessonId = "query-offline-lesson";
  mountOnlineCatalogueFetch(jobId, lessonId);
  await loadJobs();
  await loadAcademy();
  await flushScheduledCatalogPersist();
  assertListFlushHasNoBodies(jobId, lessonId);
  await loadJob(jobId);
  await flushScheduledCatalogPersist();
  assertJobBodyOnDisk(jobId);
  assertModuleBodyAbsentOnDisk(lessonId);
  await loadModule(lessonId);
  await flushScheduledCatalogPersist();
  assertModuleBodyOnDisk(lessonId);
  simulateProcessRestart();
  offlineFetch();

  onlineManager.setOnline(false);
  const client = createAppQueryClient();
  try {
    const jobs = await client.fetchQuery({
      queryKey: ["jobs-offline-cold"],
      queryFn: ({ signal }) => loadJobs(signal),
    });
    assert.deepEqual(jobs.jobs.map((row) => row.id), [jobId]);
    assert.equal(jobs.fromCache, true);

    const jobDetail = await client.fetchQuery({
      queryKey: ["job-offline-cold", jobId],
      queryFn: ({ signal }) => loadJob(jobId, signal),
    });
    assert.equal(jobDetail.fromCache, true);
    assert.equal(jobDetail.job.description, JOB_BODY_DESCRIPTION);

    const academy = await client.fetchQuery({
      queryKey: ["academy-offline-cold"],
      queryFn: ({ signal }) => loadAcademy(signal),
    });
    assert.deepEqual(academy.modules.map((row) => row.id), [lessonId]);
    assert.equal(academy.fromCache, true);

    const lesson = await client.fetchQuery({
      queryKey: ["academy-module-offline-cold", lessonId],
      queryFn: ({ signal }) => loadModule(lessonId, signal),
    });
    assert.equal(lesson.fromCache, true);
    assert.equal(lesson.module.content?.[0]?.content, LESSON_BODY_CONTENT);
  } finally {
    client.clear();
    onlineManager.setOnline(true);
  }
});
