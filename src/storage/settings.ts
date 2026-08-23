import { getKv } from "./kv";

export type DeviceSettings = {
  language: "English" | "Myanmar";
  theme: "Light" | "System";
  dataSaver: boolean;
};

const DEFAULTS: DeviceSettings = { language: "English", theme: "Light", dataSaver: false };
const KEY = "refertrm.device-settings.v1";

export function getDeviceSettings(): DeviceSettings {
  const raw = getKv().getString(KEY);
  if (!raw) return DEFAULTS;
  try {
    const parsed = JSON.parse(raw) as Partial<DeviceSettings>;
    return {
      language: parsed.language === "Myanmar" ? "Myanmar" : "English",
      theme: parsed.theme === "System" ? "System" : "Light",
      dataSaver: parsed.dataSaver === true,
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
