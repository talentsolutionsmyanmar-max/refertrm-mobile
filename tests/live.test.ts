import assert from "node:assert/strict";
import test from "node:test";
import { JOBS_LIST_QUERY, PUBLIC_API_BASE, endpoints, laterEndpoints } from "../src/api/endpoints.ts";
import { sanitizeJobs, sanitizeModules } from "../src/api/sanitize.ts";

const publicHeaders = { Accept: "application/json" } as const;

test("live Worker public jobs and academy respond with arrays", async () => {
  assert.equal(endpoints.jobs.startsWith(PUBLIC_API_BASE), true);
  assert.equal(laterEndpoints.apply, "https://www.refertrm.com/api/apply");
  assert.equal(laterEndpoints.me, "https://www.refertrm.com/api/user/me");

  const jobsRes = await fetch(`${endpoints.jobs}?${JOBS_LIST_QUERY}`, {
    headers: publicHeaders,
    signal: AbortSignal.timeout(25_000),
  });
  assert.equal(jobsRes.ok, true);
  const jobsJson = (await jobsRes.json()) as { jobs: Array<{ id: string; status: string; title: string }> };
  assert.ok(Array.isArray(jobsJson.jobs));
  assert.ok(jobsJson.jobs.length > 0);
  const jobs = sanitizeJobs(jobsJson.jobs as never);
  assert.equal(jobs.length, jobsJson.jobs.length);
  assert.ok(jobs.every((job) => job.status === "active"));

  const sampleJob = jobs[0]!;
  const jobRes = await fetch(endpoints.job(sampleJob.id), {
    headers: publicHeaders,
    signal: AbortSignal.timeout(25_000),
  });
  assert.equal(jobRes.ok, true);
  const jobDetail = (await jobRes.json()) as { job: { id: string } };
  assert.equal(jobDetail.job.id, sampleJob.id);

  const academyRes = await fetch(endpoints.academyPublic, {
    headers: publicHeaders,
    signal: AbortSignal.timeout(25_000),
  });
  assert.equal(academyRes.ok, true);
  const academyJson = (await academyRes.json()) as { modules: Array<{ id: string; slug: string; titleEn: string }> };
  assert.ok(Array.isArray(academyJson.modules));
  assert.ok(academyJson.modules.length > 0);
  const modules = sanitizeModules(academyJson.modules as never);
  assert.ok(modules.length > 0);

  const sample = modules[0]!;
  const detailRes = await fetch(endpoints.academyModule(sample.id), {
    headers: publicHeaders,
    signal: AbortSignal.timeout(25_000),
  });
  assert.equal(detailRes.ok, true);
  const detail = (await detailRes.json()) as { module: { id: string; slug: string; isPublished?: boolean } };
  assert.equal(detail.module.id, sample.id);
});
