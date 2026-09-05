import { Linking, Platform } from "react-native";

export const START_URL = "https://www.refertrm.com/start";
export const GAME_URL = "https://www.refertrm.com/eq/game";
export const MAYA_URL = "https://www.refertrm.com/eq/maya";
export const TRINITY_URL = "https://www.refertrm.com/eq/trinity";
export const REFERRALS_URL = "https://www.refertrm.com/eq/referrals";
export const SETTINGS_URL = "https://www.refertrm.com/eq/settings";
export const LOGIN_TRINITY = "https://www.refertrm.com/login?redirectTo=%2Feq%2Ftrinity";
export const LOGIN_GAME = "https://www.refertrm.com/login?redirectTo=%2Feq%2Fgame";

export function isHttpsStartUrl(raw: string): boolean {
  try {
    const url = new URL(raw.trim());
    if (url.protocol.toLowerCase() !== "https:") return false;
    const host = url.hostname.toLowerCase();
    if (host !== "www.refertrm.com" && host !== "refertrm.com") return false;
    const path = (url.pathname || "/").replace(/\/+$/, "") || "/";
    return path.toLowerCase() === "/start";
  } catch {
    return false;
  }
}

export async function openWeb(url: string): Promise<void> {
  if (Platform.OS === "android") {
    const stripped = url.replace(/^https:\/\//i, "");
    const intent =
      `intent://${stripped}#Intent;scheme=https;` +
      `action=android.intent.action.VIEW;` +
      `category=android.intent.category.BROWSABLE;` +
      `package=com.android.chrome;` +
      `S.browser_fallback_url=${encodeURIComponent(url)};end`;
    try {
      await Linking.openURL(intent);
      return;
    } catch {
      /* Chrome missing — fall through */
    }
  }
  await Linking.openURL(url);
}

export function openStartInBrowser(): Promise<void> {
  return openWeb(START_URL);
}
