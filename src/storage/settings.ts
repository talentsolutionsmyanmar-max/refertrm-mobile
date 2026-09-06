import { getKv } from "./kv";

export type DeviceSettings = {
  language: "English" | "Myanmar";
  /** NIGHT-TOKENS-007 T2 — night is the default; day is the toggle. */
  theme: "Night" | "Day";
  dataSaver: boolean;
  /** T3c — "Add your name" is stored LOCALLY, never sent anywhere, never required. */
  guestName: string;
};

const DEFAULTS: DeviceSettings = { language: "English", theme: "Night", dataSaver: false, guestName: "" };
const KEY = "refertrm.device-settings.v1";

export function getDeviceSettings(): DeviceSettings {
  const raw = getKv().getString(KEY);
  if (!raw) return DEFAULTS;
  try {
    const parsed = JSON.parse(raw) as Partial<DeviceSettings>;
    return {
      language: parsed.language === "Myanmar" ? "Myanmar" : "English",
      theme: parsed.theme === "Day" ? "Day" : "Night",
      dataSaver: parsed.dataSaver === true,
      guestName: typeof parsed.guestName === "string" ? parsed.guestName.slice(0, 60) : "",
    };
  } catch {
    return DEFAULTS;
  }
}

export function setDeviceSetting<K extends keyof DeviceSettings>(key: K, value: DeviceSettings[K]): DeviceSettings {
  const next = { ...getDeviceSettings(), [key]: value };
  getKv().set(KEY, JSON.stringify(next));
  return next;
}
