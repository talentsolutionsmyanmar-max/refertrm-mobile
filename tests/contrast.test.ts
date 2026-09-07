import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * WCAG 2.1 contrast gate for the light /start Home palette (mock v25).
 * Pair list is hand-written — a pair not listed is a pair the gate cannot see.
 */

type RGB = { r: number; g: number; b: number };

function parseColor(input: string): RGB & { a: number } {
  const s = input.trim();
  if (s.startsWith("#")) {
    let h = s.slice(1);
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    };
  }
  const m = /rgba?\(([^)]+)\)/.exec(s);
  if (!m) throw new Error(`unparseable color: ${input}`);
  const parts = m[1].split(",").map((p) => p.trim());
  return {
    r: Number(parts[0]),
    g: Number(parts[1]),
    b: Number(parts[2]),
    a: parts[3] !== undefined ? Number(parts[3]) : 1,
  };
}

function flatten(fg: RGB & { a: number }, bg: RGB): RGB {
  if (fg.a >= 1) return { r: fg.r, g: fg.g, b: fg.b };
  return {
    r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
    g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
    b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a)),
  };
}

function luminance(c: RGB): number {
  const lin = (v: number) => {
    const x = v / 255;
    return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

export function contrastRatio(fgInput: string, bgInput: string): number {
  const fgRaw = parseColor(fgInput);
  const bg = parseColor(bgInput);
  const fg = flatten(fgRaw, bg);
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const tokens = {
  navy: "#001f3f",
  gold: "#d4af37",
  ivory: "#f7f5f0",
  paper: "#fffdf8",
  teal: "#0f766e",
  ink: "#14202b",
  slate: "#5c6873",
  amber: "#a16207",
  white: "#ffffff",
  ydcBg: "#fff8df",
};

type Pair = { name: string; fg: string; bg: string; kind: "body" | "large" | "shape" };
const THRESH = { body: 4.5, large: 3.0, shape: 3.0 } as const;

const pairs: Pair[] = [
  { name: "ink on paper (card body)", fg: tokens.ink, bg: tokens.paper, kind: "body" },
  { name: "ink on ivory (page)", fg: tokens.ink, bg: tokens.ivory, kind: "body" },
  { name: "slate on paper (card meta)", fg: tokens.slate, bg: tokens.paper, kind: "body" },
  { name: "slate on ivory (page meta)", fg: tokens.slate, bg: tokens.ivory, kind: "body" },
  { name: "teal on paper (Learn label)", fg: tokens.teal, bg: tokens.paper, kind: "body" },
  { name: "amber on paper (Game/YDC label)", fg: tokens.amber, bg: tokens.paper, kind: "body" },
  { name: "amber on YDC cream", fg: tokens.amber, bg: tokens.ydcBg, kind: "body" },
  { name: "navyDeep on gold (CTA)", fg: "#001229", bg: tokens.gold, kind: "body" },
  { name: "gold on navy (role salary / large)", fg: tokens.gold, bg: tokens.navy, kind: "large" },
  { name: "white on navy (role title)", fg: tokens.white, bg: tokens.navy, kind: "large" },
  { name: "location grey on navy", fg: "#b9c6d3", bg: tokens.navy, kind: "body" },
  { name: "teal shape on paper", fg: tokens.teal, bg: tokens.paper, kind: "shape" },
  { name: "gold shape on navy", fg: tokens.gold, bg: tokens.navy, kind: "shape" },
];

test("theme.ts exports the mock v25 light tokens", () => {
  const src = readFileSync(resolve("src/theme.ts"), "utf8");
  for (const [k, v] of Object.entries(tokens)) {
    if (k === "ydcBg") continue;
    assert.match(src, new RegExp(v.replace("#", "#?"), "i"), `missing token ${k}=${v}`);
  }
});

for (const pair of pairs) {
  test(`contrast: ${pair.name}`, () => {
    const ratio = contrastRatio(pair.fg, pair.bg);
    const need = THRESH[pair.kind];
    assert.ok(ratio + 1e-9 >= need, `${pair.name}: ${ratio.toFixed(2)} < ${need}`);
  });
}
