import assert from "node:assert/strict";
import test from "node:test";
import { isPublicJob, sanitizeJobs, sanitizeModules } from "../src/api/sanitize.ts";
import type { Job } from "../src/api/types.ts";

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
    company: { id: "c1", name: "Acme", slug: "acme", logo: null, industry: null, location: null, overallRating: null, tenantEnvironment: null },
    _count: null,
    ...over,
  };
}

test("keeps active jobs including Test Engineer titles", () => {
  const keep = job({ id: "1", title: "QA Test Engineer", slug: "qa-test-engineer" });
  assert.equal(isPublicJob(keep), true);
});

test("drops inactive, demo prefixes and dummy companies", () => {
  assert.equal(isPublicJob(job({ id: "2", title: "Role", status: "closed" })), false);
  assert.equal(isPublicJob(job({ id: "3", title: "[DEMO] Warehouse", slug: "demo-warehouse" })), false);
  assert.equal(
    isPublicJob(job({ id: "4", title: "Role", company: { id: "x", name: "Demo", slug: "demo", logo: null, industry: null, location: null, overallRating: null, tenantEnvironment: null } })),
    false,
  );
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
