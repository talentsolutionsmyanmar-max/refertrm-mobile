import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * CONSUMER-UIUX-1 fail-closed gates for the six-slot Home.
 * Source-level assertions (no RN renderer in CI).
 */
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const home = readFileSync(join(root, "app/(tabs)/home.tsx"), "utf8");
const homeModule = readFileSync(join(root, "src/components/home/HomeModule.tsx"), "utf8");
const theme = readFileSync(join(root, "src/theme.ts"), "utf8");
const en = readFileSync(join(root, "src/copy/en.ts"), "utf8");
const my = readFileSync(join(root, "src/copy/my.ts"), "utf8");

test("Home renders exactly six slots in §4 order", () => {
  const markers = [
    "MOB.HOME.HERO_JOB",
    "MOB.HOME.PRIMARY",
    "MOB.HOME.LEARN",
    "MOB.HOME.YDC",
    "MOB.HOME.BROWSER_DOORS",
    "MOB.HOME.PROVENANCE",
  ];
  const positions = markers.map((m) => home.indexOf(m));
  assert.ok(positions.every((p) => p >= 0), "all six slot markers present");
  const sorted = [...positions].sort((a, b) => a - b);
  assert.deepEqual(positions, sorted, "slots appear in §4 order");
});

test("Home deletes the five retired modules", () => {
  for (const dead of ["Earn", "Settings", "Saved", "Notifications", "Journey progress"]) {
    assert.equal(home.includes(`"${dead}"`) || home.includes(`>${dead}<`), false, `${dead} must not render on Home`);
  }
});

test("exactly one gold fill among Home pressables (R1)", () => {
  const goldFills = home.match(/backgroundColor:\s*color\.gold/g) ?? [];
  assert.equal(goldFills.length, 1, "only MOB.HOME.PRIMARY fills gold");
  const goldRef = home.match(/tone="gold"/g) ?? [];
  assert.equal(goldRef.length, 0, "no HomeAction gold tone on Home");
});

test("no locked-value teaser strings anywhere in app/", () => {
  const appDir = join(root, "app");
  const stack = [appDir];
  const files: string[] = [];
  while (stack.length) {
    const dir = stack.pop()!;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.endsWith(".tsx")) files.push(full);
    }
  }
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    assert.equal(src.includes("— MMK"), false, `${file} must not contain "— MMK"`);
    assert.equal(src.includes("Your referral earnings"), false, `${file} must not contain "Your referral earnings"`);
  }
});

test("no fontSize below 11.5 and no inline font literals on governed surfaces", () => {
  // C2 — the gate scans all of src/** and app/**, not just the three named files.
  const dirs = ["src", "app"];
  const files: string[] = [];
  for (const dir of dirs) {
    const stack = [join(root, dir)];
    while (stack.length) {
      const d = stack.pop()!;
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        const full = join(d, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) files.push(full);
      }
    }
  }
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    for (const match of src.matchAll(/fontSize:\s*([\d.]+)/g)) {
      const size = Number(match[1]);
      assert.ok(size >= 11.5, `${file} has fontSize ${size} below the 11.5px floor`);
    }
  }
  // C4 — no inline font literals survive on the governed Home/state surfaces
  for (const file of ["app/(tabs)/home.tsx", "src/components/home/HomeModule.tsx", "src/components/states/ModuleState.tsx"]) {
    const src = readFileSync(join(root, file), "utf8");
    assert.equal(/fontSize:\s*\d/.test(src), false, `${file} must consume type tokens, not inline fontSize literals`);
  }
});

test("C1 — provenance names the licensed company of record, never the mother company", () => {
  const exact = "Platform: ReferTRM · company of record: Talent Resources Myanmar Co., Ltd. · Licence No. 211/2024";
  assert.ok(en.includes(`"${exact}"`), "copy.home.provenance.line must match the licensed-entity string verbatim");
  for (const dir of ["app", "src/copy"]) {
    const stack = [join(root, dir)];
    while (stack.length) {
      const d = stack.pop()!;
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        const full = join(d, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
          const src = readFileSync(full, "utf8");
          assert.equal(src.includes("Recruiter Myanmar"), false, `${full} must not name the mother company on a consumer surface`);
        }
      }
    }
  }
});

test("C3 — the no-fee line is state-independent (adjacent to PRIMARY, not inside hero branches)", () => {
  // It renders in HomeScreen's main return, after the HeroJobSlot component —
  // not inside HeroJobSlot's success/empty/error branches.
  const homeReturnIdx = home.indexOf("export default function HomeScreen");
  const nofeeIdx = home.indexOf("copy.home.heroJob.nofee", homeReturnIdx);
  assert.ok(nofeeIdx > homeReturnIdx, "no-fee line must render from HomeScreen's own JSX");
  const heroFnIdx = home.indexOf("function HeroJobSlot");
  const heroUse = home.indexOf("copy.home.heroJob.nofee");
  assert.ok(heroUse > heroFnIdx, "no-fee reference must not live inside HeroJobSlot");
});

test("HomeModule carries exactly three weights and no borderTop accent pattern", () => {
  assert.ok(homeModule.includes('"hero" | "standard" | "quiet"'));
  assert.equal(homeModule.includes("borderTopWidth"), false, "borderTop-as-weight pattern is retired");
});

test("tap stays 48", () => {
  assert.match(theme, /export const tap = 48/);
});

test("src/copy/my.ts exists with all §5 keys, every value empty", () => {
  const keys = [
    "MOB.HOME.HERO_JOB.label",
    "MOB.HOME.HERO_JOB.nofee",
    "MOB.HOME.PRIMARY.label",
    "MOB.HOME.LEARN.eyebrow",
    "MOB.HOME.LEARN.title",
    "MOB.HOME.LEARN.detail",
    "MOB.HOME.YDC.eyebrow",
    "MOB.HOME.YDC.title",
    "MOB.HOME.YDC.detail",
    "MOB.HOME.BROWSER_DOORS.header",
    "MOB.HOME.BROWSER_DOORS.opens_in_browser",
    "MOB.HOME.BROWSER_DOORS.careerGame.row_label",
    "MOB.HOME.BROWSER_DOORS.askMaya.row_label",
    "MOB.HOME.BROWSER_DOORS.trinity.row_label",
    "MOB.HOME.BROWSER_DOORS.cv.row_label",
    "MOB.HOME.BROWSER_DOORS.referrals.row_label",
    "MOB.HOME.PROVENANCE.line",
    "MOB.NAV.home",
    "MOB.NAV.jobs",
    "MOB.NAV.learn",
    "MOB.NAV.earn",
    "MOB.NAV.me",
    "MOB.STATE.loading",
    "MOB.STATE.error",
    "MOB.STATE.retry",
    "MOB.STATE.empty_jobs",
    "MOB.STATE.empty_learn",
  ];
  for (const key of keys) {
    assert.ok(my.includes(`"${key}": ""`), `my.ts must carry ${key} with an empty value`);
  }
});

test("browser doors use labelled openWeb rows and YDC goes to www /start only", () => {
  // Row URLs come from src/linking/start.ts constants (GAME_URL etc.), not inline paths.
  assert.equal(home.includes('"/eq/'), false, "home.tsx must not inline /eq/ paths");
  assert.ok(en.includes("Opens in your browser"));
  // YDC renders only through copy.home.ydc slot copy, which states the browser door
  assert.ok(home.includes("copy.home.ydc.eyebrow"), "YDC uses the home.ydc slot copy");
  assert.ok(home.includes("openStartInBrowser"), "YDC door opens www /start via openStartInBrowser");
});

test("no ActivityIndicator in src/components", () => {
  for (const dir of ["src/components"]) {
    const stack = [join(root, dir)];
    while (stack.length) {
      const d = stack.pop()!;
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        const full = join(d, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
          const src = readFileSync(full, "utf8");
          assert.equal(src.includes("ActivityIndicator"), false, `${full} must not import ActivityIndicator`);
        }
      }
    }
  }
});
