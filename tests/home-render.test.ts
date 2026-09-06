import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import {
  bandForSeed,
  bandIndex,
  classifyJobBand,
  heroSeed,
  HERO_BAND_ORDER,
  pickHeroJob,
} from "../src/home/pickHeroJob.ts";
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

function job(partial: Partial<JobListItem> & Pick<JobListItem, "id" | "title" | "level">): JobListItem {
  return {
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
    ...partial,
  };
}

/** F2 — real production shapes. level:"Manager" does not exist. */
const FIXTURE: JobListItem[] = [
  job({ id: "mid-1", title: "Warehouse Supervisor", level: "Mid" }),
  job({ id: "mid-2", title: "Sales Executive", level: "mid" }),
  job({ id: "mid-3", title: "Ops Coordinator", level: "MID" }),
  job({ id: "entry-1", title: "Cashier", level: "Entry" }),
  job({ id: "entry-2", title: "Junior Clerk", level: "entry" }),
  job({ id: "senior-1", title: "Senior Analyst", level: "Senior" }),
  job({ id: "senior-2", title: "Lead Engineer", level: "SENIOR" }),
  // Manager is a TITLE overlay with a Mid level — production shape.
  job({ id: "mgr-1", title: "National Warehouse Manager", level: "Mid" }),
  job({ id: "mgr-2", title: "Head of People", level: "Mid" }),
  job({ id: "mgr-3", title: "General Manager — Retail", level: "Mid" }),
];

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
  const files = ["app/(tabs)/home.tsx", "src/home/pickHeroJob.ts", "src/home/glyphs.tsx", "src/copy/en.ts"];
  const banned = [/\b214\b/, /\b193\b/, /\b247\b/, /\b21 courses\b/i];
  for (const file of files) {
    const text = readFileSync(resolve(file), "utf8");
    for (const re of banned) {
      assert.equal(re.test(text), false, `${file} matched ${re}`);
    }
  }
});

test("G8 classifyJobBand is exhaustive on real level shapes + manager titles", () => {
  for (const row of FIXTURE) {
    const band = classifyJobBand(row);
    assert.notEqual(band, null, `${row.id} unclassified`);
  }
  assert.equal(classifyJobBand(FIXTURE.find((j) => j.id === "mgr-1")!), "manager");
  assert.equal(classifyJobBand(job({ id: "x", title: "Clerk", level: "Mid" })), "mid");
  assert.equal(classifyJobBand(job({ id: "x", title: "Clerk", level: "ENTRY" })), "entry");
  assert.equal(classifyJobBand(job({ id: "x", title: "Clerk", level: "senior" })), "senior");
  // Zero unclassified across the fixture set.
  assert.equal(FIXTURE.filter((j) => classifyJobBand(j) === null).length, 0);
});

test("F1 band order is manager -> mid -> entry -> senior", () => {
  assert.deepEqual([...HERO_BAND_ORDER], ["manager", "mid", "entry", "senior"]);
  assert.equal(bandForSeed(0), "manager");
  assert.equal(bandForSeed(1), "mid");
  assert.equal(bandForSeed(2), "entry");
  assert.equal(bandForSeed(3), "senior");
  assert.equal(bandForSeed(4), "manager");
  assert.equal(bandIndex("entry"), 2);
});

test("G9 two seeds on the same list return two different hero job ids", () => {
  const a = pickHeroJob(FIXTURE, 0);
  const b = pickHeroJob(FIXTURE, 4); // same band (manager), next within-band index
  assert.ok(a && b);
  assert.notEqual(a!.id, b!.id, "within-band must advance across seeds");
  const c = pickHeroJob(FIXTURE, 1); // mid band
  assert.ok(c);
  assert.notEqual(a!.id, c!.id);
});

test("G10 HERO_BAND_ORDER.length equals the rendered dot count", () => {
  const home = readFileSync(resolve("app/(tabs)/home.tsx"), "utf8");
  assert.match(home, /HERO_BAND_ORDER\.map/);
  assert.equal(HERO_BAND_ORDER.length, 4);
  // No hardcoded [0,1,2,3] or 0-2 bandIndex map.
  assert.equal(/\[0,\s*1,\s*2,\s*3\]/.test(home), false);
  assert.equal(/band === "manager" \? 0/.test(home), false);
});

test("F3 heroSeed is minute-bucketed and stable within a minute", () => {
  const t = 1_700_000_000_000;
  assert.equal(heroSeed(t), heroSeed(t + 30_000));
  assert.notEqual(heroSeed(t), heroSeed(t + 60_000));
});

test("YDC glyph is a raster Image, not an empty spacer", () => {
  const home = readFileSync(resolve("app/(tabs)/home.tsx"), "utf8");
  assert.match(home, /ydc-glyph\.png/);
  assert.equal(/width: 26,\s*height: 26,\s*zIndex: 1\s*\}\s*\/>\s*<View style=\{\{ flex: 1/.test(home), false);
  assert.equal(readFileSync(resolve("assets/home/ydc-glyph.png")).length > 100, true);
  assert.equal(readFileSync(resolve("assets/home/ydc-glyph@3x.png")).length > 100, true);
});

test("G12 academy copy block has zero occurrences of courses", () => {
  const en = readFileSync(resolve("src/copy/en.ts"), "utf8");
  const match = /academy:\s*\{([\s\S]*?)\n  \},\n\n  offline:/.exec(en);
  assert.ok(match, "academy block not found");
  assert.equal(/courses/i.test(match![1]), false, match![1]);
  assert.match(match![1], /count:\s*\(n:\s*number\)\s*=>\s*`\$\{n\} lessons`/);
  assert.match(match![1], /search:\s*"Search lessons"/);
});

test("G11 Learn caption is interpolated count + lessons; 193 absent", () => {
  const home = readFileSync(resolve("app/(tabs)/home.tsx"), "utf8");
  const en = readFileSync(resolve("src/copy/en.ts"), "utf8");
  assert.equal(/\b193\b/.test(home + en), false);
  assert.equal(/21 courses/i.test(home + en), false);
  assert.equal(/all free/i.test(home + en), false);
  assert.match(en, /learnLessons:\s*\(n:\s*number\)\s*=>\s*`\$\{n\} lessons`/);
  assert.match(home, /copy\.home\.learnLessons\(lessonCount\)/);
  // "lessons" only via the interpolator — no bare caption string in home.tsx
  assert.equal(/["']\d+ lessons["']/.test(home), false);
  assert.equal(/["']0 lessons["']/.test(home + en), false);
});

test("app.json expo-font plugin lists all six faces", () => {
  const app = JSON.parse(readFileSync(resolve("app.json"), "utf8"));
  const plugins: unknown[] = app.expo.plugins;
  const fontPlugin = plugins.find((p) => Array.isArray(p) && p[0] === "expo-font") as
    | [string, { fonts: string[] }]
    | undefined;
  assert.ok(fontPlugin);
  assert.equal(fontPlugin![1].fonts.length, 6);
});

test("no Math.random call and no module-scope visit counter on Home", () => {
  const home = readFileSync(resolve("app/(tabs)/home.tsx"), "utf8");
  const pick = readFileSync(resolve("src/home/pickHeroJob.ts"), "utf8");
  assert.equal(/Math\.random\s*\(/.test(home + pick), false);
  assert.equal(/heroVisitSeq/.test(home), false);
  assert.match(home, /heroSeed\(/);
});
