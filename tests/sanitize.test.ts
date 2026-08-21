import assert from "node:assert/strict";
import test from "node:test";
import { isPublicJob, sanitizeJobs, sanitizeModules } from "../src/api/sanitize.ts";
import { parseJobRecord } from "../src/api/parse.ts";
import type { Job, JobCompany } from "../src/api/types.ts";

function company(over: Partial<JobCompany> = {}): JobCompany {
  return {
    id: "c1",
    name: "Acme",
    slug: "acme",
    logo: null,
    industry: null,
    location: null,
    overallRating: null,
    tenantEnvironment: null,
    ...over,
  };
}

function job(over: Partial<Job> & Pick<Job, "id" | "title">): Job {
  return {
    slug: over.slug ?? over.id,
    companyId: "c1",
    description: null,
    descriptionMm: null,
    titleMm: null,
    requirements: null,
    location: null,
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
    company: company(),
    _count: null,
    ...over,
  };
}

test("keeps active jobs including Test Engineer titles", () => {
  assert.equal(isPublicJob(job({ id: "1", title: "QA Test Engineer", slug: "qa-test-engineer" })), true);
  assert.equal(isPublicJob(job({ id: "2", title: "Role", status: "Active" })), true);
  assert.equal(isPublicJob(job({ id: "3", title: "Role", company: company({ tenantEnvironment: "production" }) })), true);
  assert.equal(isPublicJob(job({ id: "4", title: "Role", company: company({ tenantEnvironment: null }) })), true);
});

test("null missing empty and unknown status are rejected", () => {
  assert.equal(isPublicJob(job({ id: "n", title: "Role", status: null as unknown as string })), false);
  const missing = job({ id: "m", title: "Open role" });
  delete (missing as { status?: string }).status;
  assert.equal(isPublicJob(missing as Job), false);
  assert.equal(isPublicJob(job({ id: "e", title: "Role", status: "" })), false);
  assert.equal(isPublicJob(job({ id: "u", title: "Role", status: "unknown" })), false);
  assert.equal(isPublicJob(job({ id: "i", title: "Role", status: "inactive" })), false);
  assert.equal(isPublicJob(job({ id: "d", title: "Role", status: "draft" })), false);
  assert.equal(isPublicJob(job({ id: "c", title: "Role", status: "closed" })), false);
});

test("explicit demo and test tenant environments are rejected", () => {
  assert.equal(isPublicJob(job({ id: "td", title: "Role", company: company({ tenantEnvironment: "demo" }) })), false);
  assert.equal(isPublicJob(job({ id: "tt", title: "Role", company: company({ tenantEnvironment: "TEST" }) })), false);
});

test("reviewer probe: omitted status is not treated as active", () => {
  const probe = parseJobRecord({
    id: "93dd6ad8-a143-43f4-a188-413e1ae68ae8",
    title: "Warehouse Staff",
    slug: "makro-warehouse-staff",
    company: { id: "c", name: "Makro" },
  });
  assert.equal(probe, null);
  const withNull = job({ id: "p", title: "Warehouse Staff" });
  delete (withNull as { status?: string }).status;
  assert.equal(isPublicJob(withNull as Job), false);
});

test("sanitizeJobs de-duplicates", () => {
  const a = job({ id: "1", title: "A" });
  assert.equal(sanitizeJobs([a, a, job({ id: "2", title: "Closed", status: "archived" })]).length, 1);
});

test("sanitizeModules requires id slug title", () => {
  assert.equal(
    sanitizeModules([
      { id: "m1", titleEn: "One", titleMm: null, category: "Cat", durationMinutes: 10, xpReward: 5, level: null, order: 1, slug: "one", ksaFamily: null, ksaLevel: null, mmReady: false, quizCount: 0 },
      { id: "", titleEn: "Nope", titleMm: null, category: "Cat", durationMinutes: 10, xpReward: 5, level: null, order: 1, slug: "nope", ksaFamily: null, ksaLevel: null, mmReady: false, quizCount: 0 },
    ]).length,
    1,
  );
});
