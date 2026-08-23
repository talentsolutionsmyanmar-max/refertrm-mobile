import assert from "node:assert/strict";
import test from "node:test";
import { filterJobs, filterModules } from "../src/api/filter.ts";
import type { JobListItem } from "../src/api/types.ts";

const jobs: JobListItem[] = [
  {
    id: "1",
    title: "Warehouse Staff",
    slug: "warehouse",
    companyId: "c",
    location: "Yangon",
    salaryDisplay: "300,000 MMK",
    salaryMin: 300000,
    salaryMax: 300000,
    type: "full_time",
    level: null,
    skills: "lifting",
    urgent: true,
    featured: false,
    postedAt: null,
    createdAt: "2026-01-01",
    status: "active",
    hasDescription: true,
    hasRequirements: true,
    company: { id: "c", name: "Makro", slug: "makro", logo: null, industry: null, location: null, overallRating: null, tenantEnvironment: null },
    _count: null,
  },
  {
    id: "2",
    title: "Remote Designer",
    slug: "remote-designer",
    companyId: "c",
    location: "Remote, Myanmar",
    salaryDisplay: null,
    salaryMin: null,
    salaryMax: null,
    type: "contract",
    level: null,
    skills: null,
    urgent: false,
    featured: false,
    postedAt: null,
    createdAt: "2026-01-01",
    status: "active",
    hasDescription: false,
    hasRequirements: false,
    company: { id: "c", name: "Studio", slug: "studio", logo: null, industry: null, location: null, overallRating: null, tenantEnvironment: null },
    _count: null,
  },
];

test("search matches title company location together with place filter", () => {
  assert.equal(filterJobs(jobs, "warehouse", "yangon").map((j) => j.id).join(), "1");
  assert.equal(filterJobs(jobs, "makro", "all").length, 1);
  assert.equal(filterJobs(jobs, "designer", "yangon").length, 0);
  assert.equal(filterJobs(jobs, "", "remote").map((j) => j.id).join(), "2");
  assert.equal(filterJobs(jobs, "", "urgent").map((j) => j.id).join(), "1");
});

test("academy mm filter uses mmReady only", () => {
  const modules = [
    { id: "a", titleEn: "Serve", titleMm: "x", category: "Hospitality", durationMinutes: 10, xpReward: 5, level: null, order: 1, slug: "serve", ksaFamily: null, ksaLevel: null, mmReady: true, quizCount: 1 },
    { id: "b", titleEn: "Excel", titleMm: null, category: "Office", durationMinutes: 10, xpReward: 5, level: null, order: 2, slug: "excel", ksaFamily: null, ksaLevel: null, mmReady: false, quizCount: 0 },
  ];
  assert.equal(filterModules(modules, "", "all", true).map((m) => m.id).join(), "a");
  assert.equal(filterModules(modules, "excel", "Hospitality", false).length, 0);
});
