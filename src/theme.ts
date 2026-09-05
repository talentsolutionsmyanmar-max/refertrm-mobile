/** UI chrome. Icon/splash navy #2A3764 is locked on brand assets and is not restyled here. */
export const color = {
  navy: "#001F3F",
  gold: "#D4AF37",
  teal: "#0D9488",
  tealDark: "#0F766E",
  muted: "#64748B",
  line: "rgba(0,31,63,0.1)",
  bg: "#FFFFFF",
  white: "#FFFFFF",
  /** Cream/light neutral surfaces (matches web learner #fffdf8 on #f7f5f0). */
  cream: "#FFFDF8",
  paper: "#F7F5F0",
  /** Feedback. Kept muted, brand-adjacent. */
  correctBg: "rgba(13,148,136,0.12)",
  correctBorder: "#0D9488",
  wrongBg: "rgba(185,28,28,0.08)",
  wrongBorder: "#B91C1C",
  goldSoftBg: "rgba(154,90,0,0.07)",
  goldSoftBorder: "rgba(154,90,0,0.18)",
  goldText: "#9A5A00",
} as const;

/** 48dp minimum touch target (WCAG 2.5.5 / Material a11y). */
export const tap = 48;

/**
 * CONSUMER-UIUX-1 type scale (S339, ratified). Nothing below 11.5px.
 * hero 22/28 · h2 18/26 · h3 15/22 · body 15/22 (MM 15/27 Padauk) ·
 * body-sm 13/18 quiet-tier only · mono-label 11.5/16 uppercase tracking .08em
 */
export const type = {
  hero: { fontSize: 22, lineHeight: 28 },
  h2: { fontSize: 18, lineHeight: 26 },
  h3: { fontSize: 15, lineHeight: 22 },
  body: { fontSize: 15, lineHeight: 22 },
  /** Quiet tier only — never on hero/standard cards. */
  bodySm: { fontSize: 13, lineHeight: 18 },
  monoLabel: { fontSize: 11.5, lineHeight: 16, letterSpacing: 0.92, textTransform: "uppercase" as const },
  /** Myanmar body: Padauk, ≥1.8 line-height, never italic, never letter-spaced. */
  mmBody: { fontSize: 15, lineHeight: 27 },
} as const;

/** CONSUMER-UIUX-1 spacing, 4-base. Card padding 16 · gap 16 · gutter 16. */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
} as const;
