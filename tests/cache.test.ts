import assert from "node:assert/strict";
import test from "node:test";
import { catalog } from "../src/cache/catalog.ts";
import { resetGenerations } from "../src/cache/generation.ts";
import { loadAcademy, loadJobs } from "../src/api/load.ts";
import { resetMemoryKv } from "../src/storage/kv.ts";
import type { Job } from "../src/api/types.ts";

function job(id: string, title: string): Job {
  return {
    id,
    title,
    titleMm: null,
    slug: id,
    companyId: "c",
    description: `body-${id}`,
    descriptionMm: null,
    requirements: "req",
    location: "Yangon",
    locationMm: null,
    salaryMin: null,
    salaryMax: null,
    salaryDisplay: null,
    reward: null,
    successFee: null,
    type: "full_time",
    level: null,
    skills: null,
    status: "active",
    urgent: false,
    featured: false,
    views: null,
    createdAt: "2026-01-01",
    updatedAt: null,
    expiresAt: null,
    recruiterBrief: null,
    recruiterBriefAt: null,
    headcount: null,
    shareCount: null,
    screeningQuestions: null,
    postedAt: null,
    company: { id: "c", name: "Acme", slug: "acme", logo: null, industry: null, location: null, overallRating: null, tenantEnvironment: null },
    _count: null,
  };
}

test("failed refresh keeps cached jobs and academy", async (t) => {
  resetMemoryKv();
  resetGenerations();
  const original = globalThis.fetch;
  let mode: "ok" | "fail" = "ok";
  globalThis.fetch = (async (input: string | URL | Request) => {
    if (mode === "fail") return new Response("down", { status: 500 });
    const url = String(input);
    if (url.includes("/api/jobs")) {
      return new Response(JSON.stringify({ jobs: [job("1", "Warehouse")] }), { status: 200 });
    }
    if (url.includes("/api/academy/public")) {
      return new Response(
        JSON.stringify({
          success: true,
          count: 1,
          modules: [{ id: "m1", titleEn: "Serve", titleMm: null, category: "Hospitality", durationMinutes: 10, xpReward: 5, level: null, order: 1, slug: "serve", ksaFamily: null, ksaLevel: null, mmReady: true, quizCount: 1 }],
        }),
        { status: 200 },
      );
    }
    return new Response("nope", { status: 404 });
  }) as typeof fetch;

  t.after(() => {
    globalThis.fetch = original;
    resetMemoryKv();
    resetGenerations();
  });

  const firstJobs = await loadJobs();
  const firstAcademy = await loadAcademy();
  assert.equal(firstJobs.fromCache, false);
  assert.equal(firstJobs.jobs.length, 1);
  assert.equal(firstAcademy.modules.length, 1);
  catalog.writeJobBody(firstJobs.jobs[0]!);

  mode = "fail";
  const secondJobs = await loadJobs();
  const secondAcademy = await loadAcademy();
  assert.equal(secondJobs.fromCache, true);
  assert.equal(secondJobs.jobs[0]?.id, "1");
  assert.equal(secondAcademy.fromCache, true);
  assert.equal(catalog.findJobBody("1")?.description, "body-1");
  assert.equal("description" in catalog.snapshot().jobs[0]!, false);
});

test("empty cache surfaces the network error", async (t) => {
  resetMemoryKv();
  resetGenerations();
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response("down", { status: 500 })) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
    resetMemoryKv();
    resetGenerations();
  });
  await assert.rejects(() => loadJobs());
  await assert.rejects(() => loadAcademy());
});
