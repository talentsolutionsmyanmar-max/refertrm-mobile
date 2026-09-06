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
};

const ThemeCtx = createContext<Theme>({
  name: "night",
  colors: night,
  accents,
  majors,
  radii,
  type,
  tap,
  shadow: shadow.night,
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
