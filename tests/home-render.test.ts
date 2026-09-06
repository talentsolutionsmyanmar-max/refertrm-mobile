import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { bandForVisit, pickHeroJob, classifyJobBand } from "../src/home/pickHeroJob.ts";
import type { JobListItem } from "../src/api/types.ts";

const PROVENANCE =
  "Platform: ReferTRM · company of record: Talent Resources Myanmar Co., Ltd. · Licence No. 211/2024";

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) walk(p, out);
    else if (/\.(tsx?|ts|js)$/.test(name.name)) out.push(p);
  }
  return out;
}

test("G4 provenance string is byte-exact in en copy", () => {
  const en = readFileSync(resolve("src/copy/en.ts"), "utf8");
  assert.ok(en.includes(PROVENANCE));
  const home = readFileSync(resolve("app/(tabs)/home.tsx"), "utf8");
  assert.ok(home.includes("copy.home.provenance") || home.includes(PROVENANCE));
});

test("G4 zero Recruiter Myanmar on app/ or src/", () => {
  for (const file of [...walk("app"), ...walk("src")]) {
    const text = readFileSync(file, "utf8");
    assert.equal(text.includes("Recruiter Myanmar"), false, file);
  }
});

test("G3 no forbidden imports on launch Home", () => {
  for (const file of ["app/_layout.tsx", "app/(tabs)/home.tsx"]) {
    const text = readFileSync(resolve(file), "utf8");
    assert.equal(/@expo\/vector-icons/.test(text), false, file);
    assert.equal(/react-native-svg/.test(text), false, file);
    assert.equal(/react-native-mmkv/.test(text), false, file);
    assert.equal(/\bnew MMKV\b/.test(text), false, file);
  }
});

test("G5 no hardcoded market counts in Home tree", () => {
  const files = [
    "app/(tabs)/home.tsx",
    "src/home/pickHeroJob.ts",
    "src/home/glyphs.tsx",
    "src/copy/en.ts",
  ];
  const banned = [/\b214\b/, /\b193\b/, /\b247\b/, /\b21 courses\b/i];
  for (const file of files) {
    const text = readFileSync(resolve(file), "utf8");
    for (const re of banned) {
      assert.equal(re.test(text), false, `${file} matched ${re}`);
    }
  }
});

test("hero rotation is stratified Manager → Entry → Senior", () => {
  assert.equal(bandForVisit(0), "manager");
  assert.equal(bandForVisit(1), "entry");
  assert.equal(bandForVisit(2), "senior");
  assert.equal(bandForVisit(3), "manager");
});

test("pickHeroJob prefers the visit band", () => {
  const base = {
    slug: "x",
    companyId: "c",
    location: "Yangon",
    salaryDisplay: "1.2M - 2.0M MMK",
    salaryMin: null,
    salaryMax: null,
    reward: null,
    type: null,
    skills: null,
    urgent: false,
    featured: false,
    postedAt: null,
    createdAt: "2026-01-01",
    status: "active",
    company: null,
    _count: null,
    hasDescription: false,
    hasRequirements: false,
  } satisfies Omit<JobListItem, "id" | "title" | "level">;

  const jobs: JobListItem[] = [
    { ...base, id: "1", title: "Cashier", level: "Entry" },
    { ...base, id: "2", title: "National Warehouse Manager", level: "Manager" },
    { ...base, id: "3", title: "Senior Analyst", level: "Senior" },
  ];
  assert.equal(pickHeroJob(jobs, 0)?.id, "2");
  assert.equal(pickHeroJob(jobs, 1)?.id, "1");
  assert.equal(pickHeroJob(jobs, 2)?.id, "3");
  assert.equal(classifyJobBand(jobs[1]!), "manager");
});

test("app.json expo-font plugin lists all six faces", () => {
  const app = JSON.parse(readFileSync(resolve("app.json"), "utf8"));
  const plugins: unknown[] = app.expo.plugins;
  const fontPlugin = plugins.find((p) => Array.isArray(p) && p[0] === "expo-font") as
    | [string, { fonts: string[] }]
    | undefined;
  assert.ok(fontPlugin);
  const fonts = fontPlugin![1].fonts;
  assert.equal(fonts.length, 6);
  assert.ok(fonts.some((f) => f.includes("BricolageGrotesque-600")));
  assert.ok(fonts.some((f) => f.includes("Padauk-700")));
});
