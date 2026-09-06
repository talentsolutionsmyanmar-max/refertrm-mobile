/**
 * src/theme.ts — faithful RN mirror of ydc-brand/tokens.json.
 * SOURCE OF TRUTH: https://talentsolutionsmyanmar-max.github.io/ydc-brand/tokens.json
 * Source sha256 (transcribed): a0ee1e8fe236dc40c6432558c80c667e1654369b966d7d3589795e20f82fff89
 * Drift from upstream must be detectable — see tests/theme-tokens.test.ts.
 *
 * T1: same key names, both themes, night default. This is a MIRROR, not a
 * re-invention. Do not add, rename, or re-tint a token without an upstream change.
 */

export const radii = { lg: 22, md: 16, pill: 999 } as const;

export const majors = {
  english: "#FF7A85",
  math: "#FFC24B",
  physics: "#54C8FF",
  chemistry: "#B28CFF",
  biology: "#4ADE80",
} as const;

export const accents = {
  gold: "#FFD166",
  teal: "#5EEAD4",
  sunriseA: "#FFB25E",
  sunriseB: "#FF6E7F",
} as const;

export type ThemeName = "night" | "day";

export type ThemeColors = {
  bg0: string;
  bg1: string;
  panel: string;
  panel2: string;
  line: string;
  ink: string;
  mut: string;
  dim: string;
  glow: string;
};

export const night: ThemeColors = {
  bg0: "#070B18",
  bg1: "#0D1428",
  panel: "#141C36",
  panel2: "#1A2342",
  line: "rgba(148,163,224,0.16)",
  ink: "#F2F5FF",
  mut: "#A8B2D8",
  dim: "#6E789F",
  glow: "rgba(94,234,212,0.5)",
};

export const day: ThemeColors = {
  bg0: "#E7EFFF",
  bg1: "#F5F9FF",
  panel: "#FFFFFF",
  panel2: "#F0F4FF",
  line: "rgba(30,41,82,0.10)",
  ink: "#141B33",
  mut: "#4A5578",
  dim: "#8A93B5",
  glow: "rgba(14,165,164,0.35)",
};

/**
 * Shadow — RN-consumable, never a CSS box-shadow string (RN cannot read
 * "0 14px 40px rgba(...)"). Structured props only. On a dark theme an Android
 * elevation shadow cannot separate a dark card from a darker page (nothing is
 * below #070B18), so elevation is minimal and the 1px `line` border carries the
 * card edge — see HomeModule/home.tsx. The token records intent for platforms
 * that honour it; the gate asserts it is RN-shaped, never a CSS string.
 */
export type RNShadow = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};
export const shadow: Record<"night" | "day", RNShadow> = {
  night: { shadowColor: "#000000", shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.45, shadowRadius: 40, elevation: 4 },
  day: { shadowColor: "#3C488C", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.16, shadowRadius: 32, elevation: 3 },
} as const;

/**
 * tokens.json typeScalePx is [11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 20, 22, 26].
 * There is NO 16. Faithful mirroring retires the C4/F2 type.standard (16/22).
 * New scale: display 26 · standard 20 · body 15 · bodySm 13 · monoLabel 11.5.
 * RAISES contrast vs what shipped (26/20/15/13 vs 22/16/15/13). 11.5px floor survives.
 *
 * FONT (NIGHT-TOKENS-007): Nunito, bundled at build time via the expo-font
 * config plugin (app.json) — no async load on the launch path. Weights 400/600/
 * 700/800. On any font failure the family falls back to the Android system face
 * (Roboto), never a white screen. Padauk remains the Myanmar face.
 */
export const font = {
  /** UI Latin face. Bundled; falls back to system on any failure. */
  ui: "Nunito",
  uiRounded: "Nunito",
  /** Myanmar face — existing Academy face, unchanged. */
  mm: "Padauk",
} as const;

export const type = {
  display: { fontSize: 26, lineHeight: 34, fontFamily: "Nunito" },
  standard: { fontSize: 20, lineHeight: 28, fontFamily: "Nunito" },
  body: { fontSize: 15, lineHeight: 22, fontFamily: "Nunito" },
  /** Quiet tier only. */
  bodySm: { fontSize: 13, lineHeight: 18, fontFamily: "Nunito" },
  monoLabel: { fontSize: 11.5, lineHeight: 16, letterSpacing: 0.92, textTransform: "uppercase" as const, fontFamily: "Nunito" },
  /** Myanmar body: Padauk, ≥1.8 line-height, never italic, never letter-spaced. */
  mmBody: { fontSize: 15, lineHeight: 27, fontFamily: "Padauk" },
} as const;

/** 48dp minimum touch target. */
export const tap = 48;

/** CONSUMER-UIUX-1 spacing, 4-base. Card padding 16 · gap 16 · gutter 16. */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32 } as const;

/* ── The legacy static color shim is RETIRED (NIGHT-TOKENS-008/010). ──
 * The ambiguous keys (navy, cream, paper, tealDark, goldSoftBg) were POLYSEMOUS:
 * one name served both ink (text) and surface (fill) roles, which no single
 * mapping satisfies on a dark palette — HA measured 1.09:1 both ways. Deleted,
 * not deprecated: every remaining consumer is now a TypeScript compile error,
 * so the type system enumerates the work and cannot be forgotten. tealDark
 * (#4CC9C0) was an invented value never present in tokens.json (T1 forbids).
 * Consume useTheme().colors / .accents / .derived for themed values.
 * The keys below are the non-polysemous survivors used by legacy leaves pending
 * their own token pass.
 */
export const color = {
  gold: accents.gold,
  teal: accents.teal,
  line: night.line,
  bg: night.bg0,
  white: "#FFFFFF",
  correctBorder: accents.teal,
  wrongBorder: "#FF6E7F",
} as const;
