import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { accents, day, majors, night, radii, shadow, tap, type, type ThemeColors, type ThemeName } from "../theme";
import { getDeviceSettings, setDeviceSetting } from "../../src/storage/settings";

/**
 * T2 — theme mechanism using chrome that exists. Night is the default; the Me
 * tab's "Theme" row toggles day. The choice persists on the existing
 * device-local settings path (getDeviceSettings/setDeviceSetting over the kv
 * store already wired from _layout) — no new storage dependency, no MMKV added
 * to the launch path. Theme resolves before first paint of Home (night default),
 * so there is no light flash on a night-default app.
 */

export type Theme = {
  name: ThemeName;
  colors: ThemeColors;
  accents: typeof accents;
  majors: typeof majors;
  radii: typeof radii;
  type: typeof type;
  tap: number;
  shadow: string;
  /**
   * H2 — derived alphas. tokens.json has no skeleton/tint token, and T1 forbids
   * inventing one — so these are DERIVED at runtime from existing tokens: the
   * active theme's ink at low alpha over its real backdrop. In a dark theme the
   * tint goes LIGHTER (ink), not darker — a dark-ink-at-low-alpha literal only
   * reads on a light background. The H3 contrast gate measures the outcome.
   */
  derived: {
    /** Skeleton bars: ink at low alpha, visible on the active panel. */
    skeletonBg: string;
    /** Card label strip: a whisper of ink over the panel. */
    labelStripBg: string;
    /** Banner: gold accent fill (a light surface in both themes). */
    goldSoftBg: string;
    /** Banner text is always the dark ink — the gold fill is light in both themes. */
    bannerText: string;
    /**
     * Accent TEXT must clear contrast on the active panel. The light accents
     * (gold #FFD166, teal #5EEAD4) fail even at large size on the day's white
     * panel (measured ~1.4:1) — and tokens.json ships no deep accent variant.
     * So on day, accent text resolves to ink and the accent survives as the
     * fill/border (decorative); on night the accent text reads fine on the
     * dark panel (measured by the H3 gate). This is the honest resolution of
     * "tokens are frozen" + "day accent text is invisible".
     */
    accentTextGold: string;
    accentTextTeal: string;
  };
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function derive(name: ThemeName): Theme["derived"] {
  const c = name === "night" ? night : day;
  // H2/H3 — derived alphas, measured against the real backdrop by the contrast
  // gate. Raised until the gate clears 3.0:1 on both themes (skeleton bars and
  // the label strip are UI shapes; the banner must carry ink text at 4.5:1).
  return {
    skeletonBg: hexToRgba(c.ink, name === "night" ? 0.42 : 0.55),
    labelStripBg: hexToRgba(c.ink, name === "night" ? 0.45 : 0.55),
    // The banner is a gold FILL (a light surface in both themes) — so its text
    // is always the dark ink, never the theme's ink (which is white on night).
    // goldSoftBg is the fill; bannerText is the dark ink that reads on it.
    goldSoftBg: hexToRgba(accents.gold, name === "night" ? 0.92 : 0.55),
    bannerText: day.ink,
    // Accent text: on day the light accents fail on white panels even large,
    // and tokens.json ships no deep variant — so accent text resolves to ink on
    // day and stays gold/teal on night. Accents remain as fills/borders (decorative).
    accentTextGold: name === "night" ? accents.gold : day.ink,
    accentTextTeal: name === "night" ? accents.teal : day.ink,
  };
}

const ThemeCtx = createContext<Theme>({
  name: "night",
  colors: night,
  accents,
  majors,
  radii,
  type,
  tap,
  shadow: shadow.night,
  derived: derive("night"),
});

function buildTheme(name: ThemeName): Theme {
  return {
    name,
    colors: name === "night" ? night : day,
    accents,
    majors,
    radii,
    type,
    tap,
    shadow: name === "night" ? shadow.night : shadow.day,
    derived: derive(name),
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Night default — resolve before first paint. Never flash light first.
  const [name, setName] = useState<ThemeName>(() => {
    const stored = getDeviceSettings().theme;
    return stored === "Day" ? "day" : "night";
  });
  const [theme, setTheme] = useState<Theme>(() => buildTheme(name));

  useEffect(() => {
    setTheme(buildTheme(name));
  }, [name]);

  const value: Theme & { toggle: () => void } = {
    ...theme,
    toggle: () => {
      const next: ThemeName = name === "night" ? "day" : "night";
      setDeviceSetting("theme", next === "day" ? "Day" : "Night");
      setName(next);
    },
  } as Theme & { toggle: () => void };

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): Theme & { toggle: () => void } {
  return useContext(ThemeCtx) as Theme & { toggle: () => void };
}
