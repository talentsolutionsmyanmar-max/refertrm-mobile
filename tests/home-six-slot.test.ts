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

test("exactly one gold FILL in viewport one (R1) — gold text and gold borders are not fills", () => {
  // R1 counts fills (backgroundColor), not accents. The headcount badge is a
  // gold border and the salary is gold text — neither is a fill, and neither
  // violates one-primary. The gate asserts exactly one gold backgroundColor on
  // Home, and that gold accents exist only as text/border (never a second fill).
  const goldFills = home.match(/backgroundColor:\s*color\.gold/g) ?? [];
  assert.equal(goldFills.length, 1, "only MOB.HOME.PRIMARY fills gold");
  const goldRef = home.match(/tone="gold"/g) ?? [];
  assert.equal(goldRef.length, 0, "no HomeAction gold tone on Home");
  // If gold accents are present, they must be text (color:) or border
  // (borderColor:), never a second fill — asserted by the fill count above.
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

test("C3 — the no-fee line is state-independent and rendered once (bound to PRIMARY)", () => {
  // F1's guard evolved in S7: the no-fee line is now bound INTO the gold button
  // as a deliberate pair. It appears twice in source — once on the button's
  // accessibilityLabel (spoken) and once as the visible Text inside the button —
  // but both read the same single copy key, and there is exactly one VISIBLE
  // render site (one <Text> carrying it). The property being guarded is "one
  // source of truth + one visible instance", not "one string reference".
  const occurrences = home.match(/copy\.home\.heroJob\.nofee/g) ?? [];
  assert.equal(occurrences.length, 2, "no-fee line: exactly one a11y label + one visible Text, same key");
  // Exactly one visible Text node renders it.
  const visibleRenders = home.match(/<Text[^>]*>\s*\{copy\.home\.heroJob\.nofee\}/g) ?? [];
  assert.equal(visibleRenders.length, 1, "exactly one visible Text renders the no-fee line");
  // And it lives in HomeScreen's own JSX (state-independent), not in HeroJobSlot.
  const homeReturnIdx = home.indexOf("export default function HomeScreen");
  const nofeeIdx = home.indexOf("copy.home.heroJob.nofee", homeReturnIdx);
  assert.ok(nofeeIdx > homeReturnIdx, "no-fee line must render from HomeScreen's own JSX");
});

test("FIX-002 gate — home.tsx consumes all four hero copy keys (a dropped branch fails)", () => {
  // The bug class is "a state nobody renders." Assert all four are referenced.
  for (const key of ["heroJob.empty", "heroJob.error", "heroJob.slow", "heroJob.retry"]) {
    assert.ok(home.includes(`copy.home.${key}`), `home.tsx must consume copy.home.${key}`);
  }
});

test("FIX-002 — hero has three null-job states (empty / error / slow), none conflated, none silent", () => {
  assert.ok(home.includes("showEmpty"), "empty state (fetch ok, zero roles) must exist");
  assert.ok(home.includes("showSlow"), "slow state (budget spent, fetch alive) must exist");
  assert.ok(home.includes("showError"), "error state must exist");
  // No silent fall-through: the TS guard comment must not claim unreachable.
  assert.equal(home.includes("Unreachable"), false, "the null-job path must not be called unreachable");
  // The three meta strings are distinct events with distinct labels.
  for (const meta of ["jobs · empty", "jobs · transport"]) {
    assert.ok(home.includes(meta), `distinct meta "${meta}" must be present`);
  }
});

test("J1 — visible skeleton budget is strictly shorter than the fetch budget (SLOW is reachable)", () => {
  // If the two budgets are ever equalised, SLOW becomes a coin flip that loses
  // (the abort fires at the same instant the budget expires) and the swap-in
  // promise breaks. One line, permanent.
  const visible = Number(/HERO_VISIBLE_LOADING_MS = ([\d_]+)/.exec(home)?.[1]?.replaceAll("_", ""));
  const endpoints = readFileSync(join(root, "src/api/endpoints.ts"), "utf8");
  const fetchBudget = Number(/HERO_TIMEOUT_MS = ([\d_]+)/.exec(endpoints)?.[1]?.replaceAll("_", ""));
  assert.ok(Number.isFinite(visible) && Number.isFinite(fetchBudget), "both budgets must be readable constants");
  assert.ok(visible < fetchBudget, `visible budget (${visible}) must be strictly < fetch budget (${fetchBudget})`);
});

test("T1 — onlineManager is wired to NetInfo inside a useEffect with try/catch (offline state is reachable, launch is crash-safe)", () => {
  // TanStack Query v5 does not auto-wire NetInfo in RN — without wiring,
  // isOnline() stays true forever, fetchStatus never reaches 'paused', and the
  // hero's offline state is dead code. K1: the listener must NOT run at module
  // scope (import-time native side effect = the launch-crash shape this repo
  // already ate twice) — it must run inside a useEffect, wrapped in try/catch,
  // so a NetInfo throw degrades to pre-T1 behaviour instead of white-screening.
  const layout = readFileSync(join(root, "app/_layout.tsx"), "utf8");
  assert.ok(layout.includes("onlineManager.setEventListener"), "onlineManager.setEventListener must be wired");
  assert.ok(layout.includes('from "@react-native-community/netinfo"'), "NetInfo must be the signal source");
  // Inside a useEffect, not at module scope: the call site must sit after the
  // component's useEffect that invokes the wiring function.
  assert.ok(/useEffect\(\(\) => \{\s*wireOnlineManager\(\)/.test(layout), "wiring must run inside useEffect via wireOnlineManager()");
  // The wiring function itself must be wrapped in try/catch.
  const fnIdx = layout.indexOf("function wireOnlineManager");
  const fnBody = layout.slice(fnIdx, layout.indexOf("\n}\n", fnIdx));
  assert.ok(fnBody.includes("try"), "wireOnlineManager must wrap the listener in try/catch");
  assert.ok(fnBody.includes("catch"), "wireOnlineManager must catch so a NetInfo throw cannot crash launch");
  // And no module-scope native call: nothing between the last import and the
  // function declaration may invoke onlineManager.
  const lastImport = layout.lastIndexOf('from "');
  const betweenImportsAndComponent = layout.slice(lastImport, fnIdx);
  assert.equal(betweenImportsAndComponent.includes("onlineManager.setEventListener("), false,
    "no module-scope onlineManager side effect may survive");
});

test("T2 — no stale budget comment next to the constant it describes", () => {
  // A comment asserting a false value is how the last two bugs survived review.
  // The visible-budget constant reads 5_000; no comment may still claim 8s for it.
  const commentIdx = home.indexOf("G2a — cap the visible skeleton");
  assert.ok(commentIdx >= 0);
  const commentLine = home.slice(commentIdx, home.indexOf("\n", commentIdx));
  assert.equal(commentLine.includes("8s"), false, "the cap comment must not claim 8s when the constant is 5s");
  assert.ok(home.includes("HERO_VISIBLE_LOADING_MS = 5_000"));
});

test("J2 — HeroJobSlot has no silent null path (offline + unclassified both render honest states)", () => {
  const heroFn = home.slice(home.indexOf("function HeroJobSlot"), home.indexOf("function BrowserDoorRow"));
  assert.equal(heroFn.includes("return null"), false, "HeroJobSlot must never return null — every null-job path renders an honest state");
  assert.ok(heroFn.includes('query.fetchStatus === "paused"'), "offline paused-query detection must exist");
  assert.ok(home.includes("heroJob.offline"), "offline copy must be consumed");
});

test("FIX-003 gate — home.tsx consumes all five hero copy keys (empty · error · slow · offline · retry)", () => {
  for (const key of ["heroJob.empty", "heroJob.error", "heroJob.slow", "heroJob.offline", "heroJob.retry"]) {
    assert.ok(home.includes(`copy.home.${key}`), `home.tsx must consume copy.home.${key}`);
  }
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
