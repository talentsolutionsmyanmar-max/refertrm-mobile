import { Linking, Platform } from "react-native";

export const START_URL = "https://www.refertrm.com/start";
export const GAME_URL = "https://www.refertrm.com/eq/game";

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

export async function openStartInBrowser(): Promise<void> {
  if (Platform.OS === "android") {
    const chrome = `googlechrome://navigate?url=${encodeURIComponent(START_URL)}`;
    try {
      if (await Linking.canOpenURL(chrome)) {
        await Linking.openURL(chrome);
        return;
      }
    } catch {
      /* fall through */
    }
  }
  await Linking.openURL(START_URL);
}
