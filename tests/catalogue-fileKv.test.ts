import assert from "node:assert/strict";
import { after, mock, test } from "node:test";

const files = new Map<string, string>();
mock.module("expo-file-system/legacy", {
  namedExports: {
    documentDirectory: "file:///catalogue-filekv-test/",
    getInfoAsync: async (uri: string) => ({ exists: files.has(uri) }),
    readAsStringAsync: async (uri: string) => {
      const value = files.get(uri);
      if (value === undefined) throw new Error(`missing test file ${uri}`);
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

const FILE_URI = "file:///catalogue-filekv-test/refertrm.p1.catalog.v1.json";
const TMP_URI = `${FILE_URI}.tmp`;
const CACHE_KEY = "refertrm.p1.catalog.v1";

let hydrateCatalogFromFile: typeof import("../src/storage/fileKv").hydrateCatalogFromFile;
let resetHydrateCatalogForTests: typeof import("../src/storage/fileKv").resetHydrateCatalogForTests;
let resetMemoryKv: typeof import("../src/storage/kv").resetMemoryKv;
let getKv: typeof import("../src/storage/kv").getKv;
let resetCatalogPersistForTests: typeof import("../src/storage/fileKv").resetCatalogPersistForTests;
let persistCatalogToFile: typeof import("../src/storage/fileKv").persistCatalogToFile;
let deletePersistedCatalogFiles: typeof import("../src/storage/fileKv").deletePersistedCatalogFiles;

test.before(async () => {
  const fileKvApi = await import("../src/storage/fileKv");
  const kvApi = await import("../src/storage/kv");
  hydrateCatalogFromFile = fileKvApi.hydrateCatalogFromFile;
  resetHydrateCatalogForTests = fileKvApi.resetHydrateCatalogForTests;
  resetCatalogPersistForTests = fileKvApi.resetCatalogPersistForTests;
  persistCatalogToFile = fileKvApi.persistCatalogToFile;
  deletePersistedCatalogFiles = fileKvApi.deletePersistedCatalogFiles;
  resetMemoryKv = kvApi.resetMemoryKv;
  getKv = kvApi.getKv;
});

function reset(): void {
  files.clear();
  resetMemoryKv();
  resetHydrateCatalogForTests();
  resetCatalogPersistForTests();
}

after(() => {
  reset();
});

function minimalCatalogJson(jobId: string): string {
  return JSON.stringify({
    jobs: [
      {
        id: jobId,
        slug: jobId,
        title: "Ops assistant",
        status: "active",
        companyId: "qa-company",
        location: "Yangon",
        createdAt: "2026-01-01",
        hasDescription: false,
        hasRequirements: false,
      },
    ],
    jobBodies: {},
    jobBodyOrder: [],
    modules: [],
    moduleBodies: {},
    moduleBodyOrder: [],
    jobsSyncedAt: 1,
    academySyncedAt: null,
  });
}

test("hydrateCatalogFromFile reads a valid .tmp fallback when the main file is missing", async () => {
  reset();
  const jobId = "tmp-valid-job";
  files.set(TMP_URI, minimalCatalogJson(jobId));
  await hydrateCatalogFromFile();
  const raw = getKv().getString(CACHE_KEY);
  assert.ok(raw);
  const parsed = JSON.parse(raw) as { jobs: Array<{ id: string }> };
  assert.equal(parsed.jobs[0]?.id, jobId);
});

test("hydrateCatalogFromFile ignores corrupt .tmp fallback bytes", async () => {
  reset();
  files.set(TMP_URI, "{not-valid-catalogue-json");
  await hydrateCatalogFromFile();
  assert.equal(getKv().getString(CACHE_KEY), undefined);
});

test("catalogue delete removes .tmp so deleted data cannot reappear via fallback", async () => {
  reset();
  const liveJob = "live-job";
  const ghostJob = "ghost-job";
  getKv().set(CACHE_KEY, minimalCatalogJson(liveJob));
  await persistCatalogToFile();
  assert.equal(JSON.parse(files.get(FILE_URI)!).jobs[0].id, liveJob);

  files.set(TMP_URI, minimalCatalogJson(ghostJob));
  await deletePersistedCatalogFiles();
  assert.equal(files.has(FILE_URI), false);
  assert.equal(files.has(TMP_URI), false);

  resetMemoryKv();
  resetHydrateCatalogForTests();
  await hydrateCatalogFromFile();
  assert.equal(getKv().getString(CACHE_KEY), undefined);
});
