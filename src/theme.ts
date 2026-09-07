/**
 * Light tokens from /start (mock v25). NOT ydc-brand/tokens.json.
 * Icon/splash navy #2A3764 stays on brand assets.
 */
export const color = {
  navy: "#001f3f",
  navyDeep: "#001229",
  gold: "#d4af37",
  ivory: "#f7f5f0",
  paper: "#fffdf8",
  teal: "#0f766e",
  ink: "#14202b",
  slate: "#5c6873",
  amber: "#a16207",
  white: "#ffffff",
  line: "rgba(0,31,63,0.14)",
  lineInverse: "rgba(255,255,255,0.18)",
  /** Legacy aliases kept so non-Home surfaces compile until they migrate. */
  muted: "#5c6873",
  bg: "#f7f5f0",
  cream: "#fffdf8",
  tealDark: "#0f766e",
  correctBg: "rgba(15,118,110,0.12)",
  correctBorder: "#0f766e",
  wrongBg: "rgba(185,28,28,0.08)",
  wrongBorder: "#B91C1C",
  goldSoftBg: "rgba(161,98,7,0.07)",
  goldSoftBorder: "rgba(161,98,7,0.18)",
  goldText: "#a16207",
} as const;

export const radii = {
  r1: 10,
  r2: 16,
  r3: 22,
  pill: 999,
} as const;

/** Bundled via expo-font config plugin — family names match file stems. */
export const font = {
  display: "BricolageGrotesque-600",
  body: "Inter-400",
  bodySemi: "Inter-600",
  mono: "JetBrainsMono-600",
  myanmar: "Padauk-400",
  myanmarBold: "Padauk-700",
} as const;

export const type = {
  display: { fontFamily: font.display, fontSize: 28, lineHeight: 28 * 0.94, letterSpacing: -0.055 * 28 },
  cardTitle: { fontFamily: font.display, fontSize: 15, lineHeight: 15 * 1.06, letterSpacing: -0.035 * 15 },
  roleTitle: { fontFamily: font.display, fontSize: 21, lineHeight: 21 * 1.06, letterSpacing: -0.04 * 21 },
  salary: { fontFamily: font.display, fontSize: 21, lineHeight: 21 * 1.06, letterSpacing: -0.04 * 21 },
  tileTitle: { fontFamily: font.display, fontSize: 12, lineHeight: 12 * 1.08, letterSpacing: -0.03 * 12 },
  body: { fontFamily: font.body, fontSize: 8.5, lineHeight: 8.5 * 1.5 },
  monoLabel: { fontFamily: font.mono, fontSize: 7.5, letterSpacing: 0.08 * 7.5, fontWeight: "600" as const },
} as const;

/** 48dp minimum touch target (WCAG 2.5.5 / Material a11y). */
export const tap = 48;
