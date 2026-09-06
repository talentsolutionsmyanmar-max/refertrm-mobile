import assert from "node:assert/strict";
import test from "node:test";

/**
 * H3 — the contrast gate. The first gate in this thread that catches a visual
 * defect from source, arithmetically, with no device. It would have caught the
 * polysemous-navy invisible text (H1) and the light-surface alphas (H2) before
 * either shipped. This is the permanent one.
 *
 * WCAG 2.1 (implemented exactly per the brief):
 *   lin(c) = c/255 <= 0.04045 ? (c/255)/12.92 : (((c/255)+0.055)/1.055)^2.4
 *   L      = 0.2126*lin(R) + 0.7152*lin(G) + 0.0722*lin(B)
 *   ratio  = (max(L1,L2)+0.05) / (min(L1,L2)+0.05)
 * Thresholds: body/small text >= 4.5:1 · large text (>=18.66px bold / >=24px)
 * >= 3.0:1 · UI shapes/borders/skeleton bars >= 3.0:1. Composited alphas are
 * flattened against their real backdrop before measuring — never skipped.
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
  if (m) {
    const parts = m[1].split(",").map((p) => p.trim());
    return {
      r: Number(parts[0]),
      g: Number(parts[1]),
      b: Number(parts[2]),
      a: parts[3] !== undefined ? Number(parts[3]) : 1,
    };
  }
  throw new Error(`unparseable color: ${input}`);
}

/** Flatten a foreground (possibly translucent) over a backdrop. */
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
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

// ── The tokens, mirrored from src/theme.ts (kept in lockstep by the hash gate) ──
const night = {
  bg0: "#070B18", bg1: "#0D1428", panel: "#141C36", panel2: "#1A2342",
  line: "rgba(148,163,224,0.16)", ink: "#F2F5FF", mut: "#A8B2D8", dim: "#6E789F",
  glow: "rgba(94,234,212,0.5)",
};
const day = {
  bg0: "#E7EFFF", bg1: "#F5F9FF", panel: "#FFFFFF", panel2: "#F0F4FF",
  line: "rgba(30,41,82,0.10)", ink: "#141B33", mut: "#4A5578", dim: "#8A93B5",
  glow: "rgba(14,165,164,0.35)",
};
const accents = { gold: "#FFD166", teal: "#5EEAD4", sunriseA: "#FFB25E", sunriseB: "#FF6E7F" };
// Derived alphas — MUST mirror ThemeProvider.derive(). Ink at low alpha, lighter on dark.
function derived(name: "night" | "day") {
  const c = name === "night" ? night : day;
  const inkA = (a: number) => {
    const h = c.ink.slice(1);
    return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
  };
  const goldA = (a: number) => {
    const h = accents.gold.slice(1);
    return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
  };
  // MUST mirror ThemeProvider.derive(). Raised until the gate clears on both themes.
  return {
    skeletonBg: inkA(name === "night" ? 0.42 : 0.55),
    labelStripBg: inkA(name === "night" ? 0.45 : 0.55),
    goldSoftBg: goldA(name === "night" ? 0.92 : 0.55),
    bannerText: "#141B33", // day.ink — the banner is a gold fill (light), so its text is dark ink on both themes
  };
}

type Pair = { name: string; fg: string; bg: string; kind: "body" | "large" | "shape" };
const THRESH = { body: 4.5, large: 3.0, shape: 3.0 } as const;

function pairsFor(themeName: "night" | "day"): Pair[] {
  const c = themeName === "night" ? night : day;
  const d = derived(themeName);
  return [
    // Body / small text (>= 4.5)
    { name: "ink text on panel (card body)", fg: c.ink, bg: c.panel, kind: "body" },
    { name: "ink text on bg0 (page)", fg: c.ink, bg: c.bg0, kind: "body" },
    { name: "mut text on panel (card meta)", fg: c.mut, bg: c.panel, kind: "body" },
    { name: "mut text on bg0 (page meta)", fg: c.mut, bg: c.bg0, kind: "body" },
    { name: "mut text on bg1 (EmptyNote)", fg: c.mut, bg: c.bg1, kind: "body" },
    // Accent text is NEVER small body copy on a bare panel — it is either
    // large/bold (hero salary, card titles) or sits on a contrasting chip fill.
    // On DAY, accent text resolves to ink (the light accents fail even large on
    // a white panel and tokens.json ships no deep variant); the accent survives
    // as the fill/border. On NIGHT the accent text reads on the dark panel.
    // The pairs below measure what actually renders per theme.
    ...(themeName === "night"
      ? [
          { name: "teal accent LARGE/bold on panel (section headers)", fg: accents.teal, bg: c.panel, kind: "large" as const },
          { name: "gold accent LARGE/bold on panel (salary, title accents)", fg: accents.gold, bg: c.panel, kind: "large" as const },
        ]
      : [
          // day: accent text IS ink — measure that, not the invisible accent.
          { name: "accent text (incl. hero salary) resolves to ink on day (large/bold)", fg: c.ink, bg: c.panel, kind: "large" as const },
        ]),
    { name: "banner text (dark ink) on goldSoft banner", fg: d.bannerText, bg: d.goldSoftBg, kind: "body" },
    // Large text (>= 3.0)
    { name: "ink display 26 on panel (hero title)", fg: c.ink, bg: c.panel, kind: "large" },
    { name: "hero salary (large/bold) — accentTextGold: gold on night, ink on day", fg: themeName === "night" ? accents.gold : c.ink, bg: c.panel, kind: "large" },
    // Card FILLS (panel on page, panel2 on panel) are backgrounds, not UI shapes
    // conveying information. WCAG's 3:1 shape rule governs components that carry
    // meaning (buttons, inputs, content-placeholder bars) — not a card's tonal
    // separation from the page. On the dark palette the panel is LIGHTER than
    // the page (correct direction, per the upstream bg0→panel ladder). What is
    // gated: the TEXT on those fills (measured above) and the content-placeholder
    // skeleton bars (measured below). The fills themselves are backgrounds.
    // UI shapes / skeleton (>= 3.0)
    { name: "skeleton bar on panel", fg: d.skeletonBg, bg: c.panel, kind: "shape" },
    { name: "card label strip on panel", fg: d.labelStripBg, bg: c.panel, kind: "shape" },
    // Buttons
    { name: "bg0 text on ink (RetryState button)", fg: c.bg0, bg: c.ink, kind: "body" },
    { name: "ink text on bg0 (active Chip)", fg: c.ink, bg: c.panel, kind: "body" },
  ];
}

test("H3 — the hex-exempt legacy leaves are never contrast-exempt (measured on their own light surfaces)", () => {
  // LEGACY_HEX_EXEMPT (theme-tokens.test.ts) exempts app/jobs/[id].tsx,
  // app/learn/[slug].tsx, app/start.tsx from the HEX rule only — never from
  // contrast. Their current light surfaces measure: navy #001F3F on white,
  // muted #64748B on white, tealDark #0F766E on white. All clear WCAG 2.1.
  // When they migrate onto the token theme, these hardcoded pairs retire with them.
  const legacyPairs = [
    { name: "legacy navy #001F3F on white (detail titles/body)", fg: "#001F3F", bg: "#FFFFFF", need: 4.5 },
    { name: "legacy muted #64748B on white (meta)", fg: "#64748B", bg: "#FFFFFF", need: 4.5 },
    { name: "legacy tealDark #0F766E on white (links)", fg: "#0F766E", bg: "#FFFFFF", need: 4.5 },
  ];
  const failures: string[] = [];
  for (const p of legacyPairs) {
    const ratio = contrastRatio(p.fg, p.bg);
    if (ratio < p.need) failures.push(`${p.name}: ${ratio.toFixed(2)}:1 < ${p.need}:1`);
  }
  assert.deepEqual(failures, [], `legacy-leaf contrast failures:\n${failures.join("\n")}`);
});

test("H3 — every used foreground/background pair meets WCAG 2.1 in BOTH themes (alphas flattened)", () => {
  const failures: string[] = [];
  const rows: string[] = [];
  for (const themeName of ["night", "day"] as const) {
    for (const p of pairsFor(themeName)) {
      const ratio = contrastRatio(p.fg, p.bg);
      const need = THRESH[p.kind];
      const ok = ratio >= need;
      rows.push(`${themeName}  ${ok ? "PASS" : "FAIL"}  ${ratio.toFixed(2)}:1 (need ${need})  ${p.name}`);
      if (!ok) failures.push(`${themeName} ${p.name}: ${ratio.toFixed(2)}:1 < ${need}:1`);
    }
  }
  // The full contrast table is the return artifact — print it for the record.
  console.log("\n" + rows.join("\n"));
  assert.deepEqual(failures, [], `contrast failures:\n${failures.join("\n")}`);
});
