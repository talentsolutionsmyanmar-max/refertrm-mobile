import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeJobs, sanitizeModules } from "../src/api/sanitize.ts";

test("live public jobs and academy respond with arrays", async () => {
  const jobsRes = await fetch("https://www.refertrm.com/api/jobs?status=active&limit=500", {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(25_000),
  });
  assert.equal(jobsRes.ok, true);
  const jobsJson = (await jobsRes.json()) as { jobs: Array<{ id: string; status: string; title: string }> };
  assert.ok(Array.isArray(jobsJson.jobs));
  assert.ok(jobsJson.jobs.length > 0);
  const jobs = sanitizeJobs(jobsJson.jobs as never);
  assert.equal(jobs.length, jobsJson.jobs.length);
  assert.ok(jobs.every((job) => job.status === "active"));

  const academyRes = await fetch("https://www.refertrm.com/api/academy/public", {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(25_000),
  });
  assert.equal(academyRes.ok, true);
  const academyJson = (await academyRes.json()) as { modules: Array<{ id: string; slug: string; titleEn: string }> };
  assert.ok(Array.isArray(academyJson.modules));
  assert.ok(academyJson.modules.length > 0);
  const modules = sanitizeModules(academyJson.modules as never);
  assert.ok(modules.length > 0);

  const sample = modules[0]!;
  const detailRes = await fetch(`https://www.refertrm.com/api/academy/modules/${sample.id}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(25_000),
  });
  assert.equal(detailRes.ok, true);
  const detail = (await detailRes.json()) as { module: { id: string; slug: string; isPublished?: boolean } };
  assert.equal(detail.module.id, sample.id);
});
