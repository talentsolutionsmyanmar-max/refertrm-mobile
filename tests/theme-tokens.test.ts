import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * NIGHT-TOKENS-007 — T1 + T5 gates. The theme is a faithful RN mirror of
 * ydc-brand/tokens.json; drift from upstream must be detectable, not discovered.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const theme = readFileSync(join(root, "src/theme.ts"), "utf8");

/** sha256 of the upstream tokens.json this file was transcribed from. */
export const TOKENS_JSON_SHA256 = "a0ee1e8fe236dc40c6432558c80c667e1654369b966d7d3589795e20f82fff89";

// The brand palette (tokens.json, lower-cased full-form). R1 port.
const PALETTE = [
  "#ff7a85", "#ffc24b", "#54c8ff", "#b28cff", "#4ade80", // five majors
  "#ffd166", "#5eead4", "#ffb25e", "#ff6e7f", // accents
  "#070b18", "#0d1428", "#141c36", "#1a2342", // night surfaces
  "#f2f5ff", "#a8b2d8", "#6e789f", // night ink
  "#e7efff", "#f5f9ff", "#ffffff", "#f0f4ff", // day surfaces
  "#141b33", "#4a5578", "#8a93b5", // day ink
];

/**
 * Legacy surfaces carry pre-token hex literals (app/start.tsx, the jobs/learn
 * detail leaves, the two older tabs, ui.tsx). They are NOT in this brief's
 * restyle scope and get their own pass. The gate enforces the palette on the
 * files NIGHT-TOKENS-007 owns; legacy files are enumerated so the exception is
 * explicit and countable, not silent. Deleting one from this list is the pass.
 */
const LEGACY_HEX_EXEMPT = new Set([
  "app/start.tsx",
  "app/learn/[slug].tsx",
  "app/jobs/[id].tsx",
]);

function sourceFiles(): string[] {
  const out: string[] = [];
  for (const dir of ["src", "app"]) {
    const stack = [join(root, dir)];
    while (stack.length) {
      const d = stack.pop()!;
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        const full = join(d, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) out.push(full);
      }
    }
  }
  return out;
}

test("T1 — src/theme.ts records the upstream tokens.json source hash", () => {
  assert.ok(theme.includes(TOKENS_JSON_SHA256), "theme.ts must record the tokens.json sha256 it was transcribed from");
});

test("J1 — the shadow token is RN-shaped, never a CSS box-shadow string", () => {
  // RN consumes shadowColor/Offset/Opacity/Radius + elevation. A CSS string like
  // "0 14px 40px rgba(...)" is silently ignored — an absent token is better.
  assert.equal(/shadow[^=]*=\s*\{[^}]*"0 \d+px/.test(theme), false, "shadow must not be a CSS string");
  assert.ok(theme.includes("shadowColor"), "RN shadow needs shadowColor");
  assert.ok(theme.includes("shadowOffset"), "RN shadow needs shadowOffset");
  assert.ok(theme.includes("shadowOpacity"), "RN shadow needs shadowOpacity");
  assert.ok(theme.includes("shadowRadius"), "RN shadow needs shadowRadius");
  assert.ok(theme.includes("elevation"), "RN shadow needs Android elevation");
  // On a dark theme an elevation shadow cannot separate a dark card from a
  // darker page — the 1px line border carries the edge. Assert the hero carries it.
  const home = readFileSync(join(root, "app/(tabs)/home.tsx"), "utf8");
  const heroIdx = home.indexOf("T3/J1");
  const heroBlock = home.slice(heroIdx, heroIdx + 600);
  assert.ok(heroBlock.includes("borderWidth: 1"), "hero card must carry the 1px line border (shadow cannot work on dark-on-dark)");
});

test("T1 — type scale is a faithful mirror (no 16; display 26 / standard 20 / body 15 / bodySm 13 / monoLabel 11.5)", () => {
  assert.ok(theme.includes("display: { fontSize: 26, lineHeight: 34"), "display 26/34");
  assert.ok(theme.includes("standard: { fontSize: 20, lineHeight: 28"), "standard 20/28");
  assert.ok(theme.includes("body: { fontSize: 15, lineHeight: 22"), "body 15/22");
  assert.ok(theme.includes("bodySm: { fontSize: 13, lineHeight: 18"), "bodySm 13/18");
  assert.ok(theme.includes("monoLabel: { fontSize: 11.5"), "monoLabel 11.5 floor");
  assert.equal(theme.includes("fontSize: 16"), false, "16px is off the upstream scale — retired");
});

test("T5 — no hex literal outside the brand palette anywhere in src/** + app/**", () => {
  const offenders: string[] = [];
  for (const file of sourceFiles()) {
    const rel = file.slice(root.length + 1);
    if (LEGACY_HEX_EXEMPT.has(rel)) continue; // enumerated legacy surfaces, pending their own pass
    const src = readFileSync(file, "utf8");
    // token definitions in theme.ts are the palette itself
    const lines = src.split("\n");
    lines.forEach((text, i) => {
      if (/lint-ok/.test(text)) return;
      const isThemeDef = file.endsWith("src/theme.ts");
      const found = text.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
      for (const h of found) {
        const norm = h.toLowerCase();
        const full = norm.length === 4 ? "#" + [...norm.slice(1)].map((c) => c + c).join("") : norm.slice(0, 7);
        if (isThemeDef) continue; // theme.ts defines the palette
        if (!PALETTE.includes(full)) offenders.push(`${rel}:${i + 1} ${h}`);
      }
    });
  }
  assert.deepEqual(offenders, [], `off-palette hex literals: ${offenders.join(", ")}`);
});

test("T5 — the legacy-hex exemption list is explicit and must shrink, never silently grow", () => {
  // Any file removed from LEGACY_HEX_EXEMPT has been restyled onto tokens.
  // The list may only shrink. Asserting its exact members makes a new
  // off-palette surface a deliberate, reviewed addition.
  // NIGHT-TOKENS-008 scope extension shrank it to the two detail leaves +
  // app/start.tsx — hex-exempt only, NEVER contrast-exempt (see contrast.test.ts).
  const actual = [...LEGACY_HEX_EXEMPT].sort();
  assert.deepEqual(actual, [
    "app/jobs/[id].tsx",
    "app/learn/[slug].tsx",
    "app/start.tsx",
  ].sort());
});

test("T5 — theme parity: every token key exists in BOTH night and day", () => {
  for (const key of ["bg0", "bg1", "panel", "panel2", "line", "ink", "mut", "dim", "glow"]) {
    assert.ok(theme.includes(`${key}: `), `key ${key} present`);
  }
  const nightBlock = theme.slice(theme.indexOf("export const night"), theme.indexOf("export const day"));
  const dayBlock = theme.slice(theme.indexOf("export const day"), theme.indexOf("export const shadow"));
  for (const key of ["bg0", "bg1", "panel", "panel2", "line", "ink", "mut", "dim", "glow"]) {
    assert.ok(nightBlock.includes(`${key}:`), `night.${key}`);
    assert.ok(dayBlock.includes(`${key}:`), `day.${key}`);
  }
});

test("T5 — the retired 3G law is not re-stated in any tokens/lint narrative this brief touches", () => {
  // KoKo retired the 3G law (Myanmar users are on 4G). Local bundled fonts are
  // not remote assets. No "zero images / zero webfonts" line may survive in the
  // RN theme/gate narrative. (The test's own strings are excluded — it asserts
  // the narrative is absent from the SHIPPED files, not from the test that
  // checks for it.)
  assert.equal(/3G law/i.test(theme), false, "the retired 3G law must not be re-stated in theme.ts");
  assert.equal(/zero images, zero webfonts, zero external asset calls/i.test(theme), false);
});

test("K2 — zero consumers of the deleted polysemous keys anywhere outside their absence (the type system is the gate, this is the proof)", () => {
  // 008's instruction was to DELETE the ambiguous keys, not deprecate them. A
  // deleted key makes every remaining consumer a TypeScript compile error —
  // stronger than any test, it cannot be forgotten and it enumerates itself.
  // This gate proves the deletion held: no reference to a deleted key survives
  // in src/** + app/**. A pair that cannot be constructed cannot fail.
  const DELETED = ["color.navy", "color.cream", "color.paper", "color.tealDark", "color.goldSoftBg", "color.muted"];
  const offenders: string[] = [];
  const stack = [join(root, "src"), join(root, "app")];
  while (stack.length) {
    const d = stack.pop()!;
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        const src = readFileSync(full, "utf8");
        for (const key of DELETED) {
          if (src.includes(key)) offenders.push(`${full.slice(root.length + 1)}: ${key}`);
        }
      }
    }
  }
  assert.deepEqual(offenders, [], `references to deleted polysemous keys survive:\n${offenders.join("\n")}`);
  // And the keys are genuinely absent from the export (not commented-out).
  for (const key of ["navy:", "cream:", "paper:", "tealDark:", "goldSoftBg:", "muted:"]) {
    assert.equal(theme.includes(key), false, `theme.ts must not define ${key}`);
  }
});
