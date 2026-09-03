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
