import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchJob, fetchJobs } from "../src/api/client.ts";
import { JOBS_LIST_QUERY, endpoints } from "../src/api/endpoints.ts";
import { resolveJobField } from "../src/api/jobField.ts";
import { loadJob, loadJobs } from "../src/api/load.ts";
import { parseJobDetailEnvelope, parseJobsEnvelope } from "../src/api/parse.ts";
import { catalog, CATALOG_KEY, MAX_JOB_BODIES } from "../src/cache/catalog.ts";
import { resetGenerations } from "../src/cache/generation.ts";
import { getKv, resetMemoryKv } from "../src/storage/kv.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function summaryRow(over: Record<string, unknown> = {}) {
  return {
    id: "cd69a2ce-61c5-4c4a-a656-7ceb49eed091",
    title: "Basic Staff",
    slug: "makro-basic-staff-butchery",
    status: "active",
    companyId: "c",
    company: { id: "c", name: "Acme", tenantEnvironment: null },
    location: "Yangon",
    type: "full_time",
    urgent: false,
    createdAt: "2026-01-01",
    hasDescription: true,
    hasRequirements: true,
    ...over,
  };
}

function detailJob(over: Record<string, unknown> = {}) {
  return {
    id: "cd69a2ce-61c5-4c4a-a656-7ceb49eed091",
    title: "Basic Staff",
    slug: "makro-basic-staff-butchery",
    status: "active",
    companyId: "c",
    company: { id: "c", name: "Acme", tenantEnvironment: null },
    description: "A live warehouse description.",
    requirements: "Must lift.",
    location: "Yangon",
    type: "full_time",
    urgent: false,
    createdAt: "2026-01-01",
    ...over,
  };
}

function jsonFetch(handler: (url: string) => { status?: number; body: unknown } | Response) {
  return (async (input: string | URL | Request) => {
    const url = String(input);
    const result = handler(url);
    if (result instanceof Response) return result;
    return new Response(JSON.stringify(result.body), { status: result.status ?? 200 });
  }) as typeof fetch;
}

test("summary envelope and flags", () => {
  const jobs = parseJobsEnvelope({
    jobs: [
      summaryRow(),
      summaryRow({
        id: "51f1a427-0791-4dff-8a98-acf5cc825972",
        slug: "japanese-translator-bad063",
        title: "Japanese Translator",
        hasDescription: false,
        hasRequirements: false,
      }),
    ],
  });
  assert.equal(jobs.length, 2);
  assert.equal(jobs[0]?.hasDescription, true);
  assert.equal(jobs[0]?.hasRequirements, true);
  assert.equal("description" in jobs[0]!, false);
  assert.equal("requirements" in jobs[0]!, false);
  assert.equal(jobs[1]?.hasDescription, false);
  assert.equal(JOBS_LIST_QUERY, "status=active&limit=500&view=summary");
});

test("summary rejects malformed flag/body shapes safely", () => {
  const mixed = parseJobsEnvelope({
    jobs: [
      summaryRow(),
      summaryRow({ id: "bad-flag", slug: "bad-flag", hasDescription: "yes" }),
      summaryRow({ id: "bad-body", slug: "bad-body", description: 12 }),
    ],
  });
  assert.equal(mixed.length, 1);
  assert.equal(mixed[0]?.id, summaryRow().id);
  assert.throws(() => parseJobsEnvelope({ jobs: [{ title: "nope", hasDescription: "true" }] }));
});

test("detail exact-ID parsing", () => {
  const job = parseJobDetailEnvelope({ job: detailJob() });
  assert.equal(job.id, detailJob().id);
  assert.equal(job.description?.includes("warehouse"), true);
});

test("detail slug parsing", () => {
  const job = parseJobDetailEnvelope({
    job: detailJob({ id: "abc", slug: "makro-basic-staff-butchery" }),
  });
  assert.equal(job.slug, "makro-basic-staff-butchery");
});

test("detail 404", async (t) => {
  resetMemoryKv();
  resetGenerations();
  const original = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = jsonFetch((url) => {
    urls.push(url);
    return { status: 404, body: { error: "Job not found" } };
  });
  t.after(() => {
    globalThis.fetch = original;
    resetMemoryKv();
    resetGenerations();
  });
  await assert.rejects(loadJob("missing-job"), (error: unknown) => {
    assert.equal((error as Error).message, "refertrm_404");
    return true;
  });
  assert.equal(catalog.findJobBody("missing-job"), undefined);
  assert.equal(urls.some((url) => url.includes("limit=500")), false);
});

test("honest empty JD versus unavailable body", () => {
  assert.equal(
    resolveJobField({ loaded: true, loadedValue: null, cached: false, listed: true }).state,
    "empty",
  );
  assert.equal(
    resolveJobField({ loaded: false, cached: false, listed: true }).state,
    "unavailable",
  );
  assert.equal(
    resolveJobField({ loaded: false, cached: false, listed: false }).state,
    "empty",
  );
  assert.equal(
    resolveJobField({ loaded: false, cached: true, cachedValue: null, listed: true }).state,
    "empty",
  );
  assert.equal(resolveJobField({ loaded: true, loadedValue: "Hello", cached: false }).text, "Hello");
});

test("LRU write/read/eviction", () => {
  resetMemoryKv();
  for (let i = 0; i < MAX_JOB_BODIES + 1; i += 1) {
    catalog.writeJobBody({
      id: `job-${i}`,
      description: `body-${i}`,
      requirements: "req",
    });
  }
  assert.equal(catalog.findJobBody("job-0"), undefined);
  assert.equal(catalog.findJobBody(`job-${MAX_JOB_BODIES}`)?.description, `body-${MAX_JOB_BODIES}`);
  assert.equal(catalog.snapshot().jobBodyOrder.length, MAX_JOB_BODIES);
});

test("legacy cache-body migration", () => {
  resetMemoryKv();
  getKv().set(
    CATALOG_KEY,
    JSON.stringify({
      jobs: [
        {
          id: "legacy-1",
          title: "National Warehouse Manager",
          slug: "warehouse-manager",
          status: "active",
          companyId: "c",
          location: "Yangon",
          type: "full_time",
          urgent: false,
          featured: false,
          createdAt: "2026-01-01",
          description: "A 1286 character legacy body.",
          requirements: "159 chars of requirements.",
        },
      ],
      jobBodies: {},
      jobBodyOrder: [],
      modules: [],
      moduleBodies: {},
      moduleBodyOrder: [],
      jobsSyncedAt: Date.now(),
      academySyncedAt: null,
    }),
  );
  const snap = catalog.snapshot();
  assert.equal(snap.jobs[0]?.hasDescription, true);
  assert.equal(snap.jobs[0]?.hasRequirements, true);
  assert.equal("description" in snap.jobs[0]!, false);
  assert.equal(catalog.findJobBody("legacy-1")?.description, "A 1286 character legacy body.");
});

test("detail does not request limit=500 or call the list loader", async (t) => {
  resetMemoryKv();
  resetGenerations();
  const original = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = jsonFetch((url) => {
    urls.push(url);
    if (url.includes("/api/jobs/") && !url.includes("?")) {
      return { body: { job: detailJob() } };
    }
    return { body: { jobs: [summaryRow()] } };
  });
  t.after(() => {
    globalThis.fetch = original;
    resetMemoryKv();
    resetGenerations();
  });

  const list = await loadJobs();
  assert.equal(list.jobs[0]?.hasDescription, true);
  assert.ok(urls[0]?.includes("status=active&limit=500&view=summary"));
  urls.length = 0;

  const byId = await loadJob(detailJob().id);
  assert.equal(byId.job.description, "A live warehouse description.");
  assert.equal(urls.length, 1);
  assert.equal(urls[0], `${endpoints.jobs}/${encodeURIComponent(detailJob().id)}`);
  assert.equal(urls[0]?.includes("limit=500"), false);
  assert.equal(urls[0]?.includes("view=summary"), false);

  urls.length = 0;
  const bySlug = await loadJob("makro-basic-staff-butchery");
  assert.equal(bySlug.job.slug, "makro-basic-staff-butchery");
  assert.equal(urls[0], `${endpoints.jobs}/${encodeURIComponent("makro-basic-staff-butchery")}`);

  const screen = readFileSync(join(root, "app/jobs/[id].tsx"), "utf8");
  assert.equal(screen.includes("loadJobs"), false);
  assert.equal(screen.includes('queryKey: ["job"'), true);
  assert.equal(screen.includes("limit=500"), false);
});

test("successful empty detail is cached and not treated as a network failure", async (t) => {
  resetMemoryKv();
  resetGenerations();
  const original = globalThis.fetch;
  globalThis.fetch = jsonFetch(() => ({
    body: { job: detailJob({ description: null, requirements: null, title: "Japanese Translator" }) },
  }));
  t.after(() => {
    globalThis.fetch = original;
    resetMemoryKv();
    resetGenerations();
  });
  const result = await loadJob("51f1a427-0791-4dff-8a98-acf5cc825972");
  assert.equal(result.job.description, null);
  assert.equal(catalog.findJobBody("cd69a2ce-61c5-4c4a-a656-7ceb49eed091")?.description, null);
  const field = resolveJobField({
    loaded: true,
    loadedValue: result.job.description,
    cached: true,
    cachedValue: null,
    listed: false,
  });
  assert.equal(field.state, "empty");
});

test("fetchJobs uses the summary query and fetchJob uses the detail path", async (t) => {
  const original = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = jsonFetch((url) => {
    urls.push(url);
    return { body: { jobs: [] } };
  });
  t.after(() => {
    globalThis.fetch = original;
  });
  await fetchJobs();
  await fetchJob("abc-123").catch(() => undefined);
  assert.equal(urls[0], `${endpoints.jobs}?${JOBS_LIST_QUERY}`);
  assert.equal(urls[1], `${endpoints.job(encodeURIComponent("abc-123"))}`);
});
