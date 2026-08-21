import assert from "node:assert/strict";
import test from "node:test";
import { catalog } from "../src/cache/catalog.ts";
import { resetGenerations } from "../src/cache/generation.ts";
import { loadAcademy, loadJobs } from "../src/api/load.ts";
import { parseAcademyEnvelope, parseJobsEnvelope, parseModuleEnvelope } from "../src/api/parse.ts";
import { resetMemoryKv } from "../src/storage/kv.ts";

function jobJson(id: string, title: string) {
  return {
    id,
    title,
    slug: id,
    status: "active",
    companyId: "c",
    company: { id: "c", name: "Acme", tenantEnvironment: null },
    description: `body-${id}`,
    requirements: "req",
    location: "Yangon",
    type: "full_time",
    urgent: false,
    createdAt: "2026-01-01",
  };
}

const catalogueRow = {
  id: "cmmxl27790019lq6737n3ev18",
  titleEn: "Serve with Dignity",
  titleMm: null,
  category: "Hospitality",
  durationMinutes: 12,
  xpReward: 20,
  level: "applied",
  order: 1,
  slug: "serve-with-dignity-how-confident-service-gets-you-promoted-faster-than-silent-obedience",
  ksaFamily: "service",
  ksaLevel: "2",
  mmReady: true,
  quizCount: 3,
};

const detailRow = {
  success: true,
  module: {
    id: "cmmxl27790019lq6737n3ev18",
    slug: "serve-with-dignity-how-confident-service-gets-you-promoted-faster-than-silent-obedience",
    titleEn: "Serve with Dignity",
    titleMm: "ခေါင်းစဉ်",
    category: "Hospitality",
    durationMinutes: 12,
    xpReward: 20,
    content: [{ type: "takeaway", title: "Key Takeaway", content: "Be visible." }],
    contentMm: JSON.stringify([{ type: "text", content: "မြန်မာ" }]),
    mmContentReady: true,
    isPublished: true,
    quizQuestions: [{ question: "Q?", options: ["A", "B"] }],
    quizQuestionsMm: "[]",
    furtherReadingUrl: null,
    furtherReadingLabel: null,
    hookTextMm: null,
    keyTakeawayMm: null,
    commonMistakeMm: null,
    actionStepsMm: null,
    decisionScenarioMm: null,
  },
};

test("malformed 200 jobs envelopes preserve cache", async (t) => {
  resetMemoryKv();
  resetGenerations();
  const original = globalThis.fetch;
  let payload: unknown = { jobs: [jobJson("1", "Warehouse")] };
  globalThis.fetch = (async () => new Response(JSON.stringify(payload), { status: 200 })) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
    resetMemoryKv();
    resetGenerations();
  });
  await loadJobs();
  assert.equal(catalog.snapshot().jobs[0]?.id, "1");

  for (const bad of [{}, { jobs: null }, "nope", 5]) {
    payload = bad;
    const result = await loadJobs();
    assert.equal(result.fromCache, true);
    assert.equal(catalog.snapshot().jobs[0]?.id, "1");
  }
});

test("malformed 200 academy envelopes preserve cache", async (t) => {
  resetMemoryKv();
  resetGenerations();
  const original = globalThis.fetch;
  let payload: unknown = { success: true, modules: [catalogueRow], count: 1 };
  globalThis.fetch = (async () => new Response(JSON.stringify(payload), { status: 200 })) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
    resetMemoryKv();
    resetGenerations();
  });
  await loadAcademy();
  assert.equal(catalog.snapshot().modules[0]?.id, catalogueRow.id);

  for (const bad of [{}, { modules: null }, [], { success: true }]) {
    payload = bad;
    const result = await loadAcademy();
    assert.equal(result.fromCache, true);
    assert.equal(catalog.snapshot().modules[0]?.id, catalogueRow.id);
  }
});

test("valid empty arrays persist empty catalogues", async (t) => {
  resetMemoryKv();
  resetGenerations();
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("/api/jobs")) return new Response(JSON.stringify({ jobs: [] }), { status: 200 });
    if (url.includes("/api/academy/public")) {
      return new Response(JSON.stringify({ success: true, modules: [], count: 0 }), { status: 200 });
    }
    return new Response("no", { status: 404 });
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
    resetMemoryKv();
    resetGenerations();
  });
  const jobs = await loadJobs();
  const academy = await loadAcademy();
  assert.equal(jobs.fromCache, false);
  assert.deepEqual(jobs.jobs, []);
  assert.equal(catalog.snapshot().jobs.length, 0);
  assert.equal(academy.fromCache, false);
  assert.deepEqual(academy.modules, []);
});

test("malformed 200 after a valid empty catalogue preserves empty cache", async (t) => {
  resetMemoryKv();
  resetGenerations();
  const original = globalThis.fetch;
  let payload: unknown = { jobs: [] };
  globalThis.fetch = (async () => new Response(JSON.stringify(payload), { status: 200 })) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
    resetMemoryKv();
    resetGenerations();
  });
  const empty = await loadJobs();
  assert.equal(empty.fromCache, false);
  assert.equal(catalog.snapshot().jobsSyncedAt != null, true);

  payload = {};
  const preserved = await loadJobs();
  assert.equal(preserved.fromCache, true);
  assert.deepEqual(preserved.jobs, []);
  assert.equal(catalog.snapshot().jobs.length, 0);
});

test("malformed individual records are dropped not crashed", () => {
  const jobs = parseJobsEnvelope({
    jobs: [jobJson("1", "Good"), { title: "Nope" }, null, "x"],
  });
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0]?.id, "1");
  const modules = parseAcademyEnvelope({
    modules: [catalogueRow, { id: "x" }, null],
  });
  assert.equal(modules.length, 1);
});

test("detail envelope matches live shape without catalogue-only fields", () => {
  const detail = parseModuleEnvelope(detailRow);
  assert.equal(detail.id, catalogueRow.id);
  assert.equal(detail.mmContentReady, true);
  assert.equal("quizCount" in detail, false);
  assert.ok(Array.isArray(detail.content));
});

test("parseJobsEnvelope rejects missing arrays", () => {
  assert.throws(() => parseJobsEnvelope({}));
  assert.throws(() => parseJobsEnvelope({ jobs: null }));
  assert.doesNotThrow(() => parseJobsEnvelope({ jobs: [] }));
});
