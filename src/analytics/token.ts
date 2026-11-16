export const MIXPANEL_TOKEN_ENV = "EXPO_PUBLIC_MIXPANEL_TOKEN";

const TOKEN_MAX = 64;
const TOKEN_PATTERN = /^[A-Za-z0-9._-]{8,64}$/;

function readToken(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed.length > TOKEN_MAX) return null;
  if (!TOKEN_PATTERN.test(trimmed)) return null;
  return trimmed;
}

/** Public Mixpanel project token. Unset/invalid → analytics is a no-op. */
export function getMixpanelToken(): string | null {
  return readToken(process.env.EXPO_PUBLIC_MIXPANEL_TOKEN);
}
