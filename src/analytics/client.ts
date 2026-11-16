import { createRequestSignal } from "../api/signal";
import {
  isMixpanelEventName,
  sanitizeMixpanelProperties,
  type MixpanelEventName,
} from "./catalog";
import { getOrCreateInstallId, hydrateInstallId } from "./identity";
import { getMixpanelToken } from "./token";

export type { MixpanelEventName };

/** Matches web Academy search debounce (25referTRM PR #1018). */
export const SEARCH_DEBOUNCE_MS = 700;

const MIXPANEL_TRACK_URL = "https://api.mixpanel.com/track?verbose=1";
const MIXPANEL_TIMEOUT_MS = 2500;

type AppMeta = {
  platform: string;
  app_version: string;
};

let appMeta: AppMeta = { platform: "android", app_version: "1.0.0" };

export function setAnalyticsAppMeta(meta: Partial<AppMeta>): void {
  if (meta.platform && meta.platform.length <= 32) appMeta = { ...appMeta, platform: meta.platform };
  if (meta.app_version && meta.app_version.length <= 32) {
    appMeta = { ...appMeta, app_version: meta.app_version };
  }
}

export function analyticsAppMeta(): AppMeta {
  return appMeta;
}

function insertId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") return cryptoObj.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function postTrack(event: MixpanelEventName, properties: Record<string, unknown>): Promise<void> {
  const token = getMixpanelToken();
  if (!token) return;

  const distinctId = getOrCreateInstallId();
  const sanitized = sanitizeMixpanelProperties({
    ...properties,
    platform: appMeta.platform,
    app_version: appMeta.app_version,
  });

  const payload = [
    {
      event,
      properties: {
        ...sanitized,
        token,
        distinct_id: distinctId,
        time: Math.floor(Date.now() / 1000),
        $insert_id: insertId(),
        $source: "refertrm-android",
      },
    },
  ];

  const request = createRequestSignal(undefined, MIXPANEL_TIMEOUT_MS);
  try {
    await fetch(MIXPANEL_TRACK_URL, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: request.signal,
    });
  } catch {
    /* fire-and-forget: slow Myanmar networks must not block UI */
  } finally {
    request.cleanup();
  }
}

/**
 * Fire-and-forget Mixpanel capture. No-ops when EXPO_PUBLIC_MIXPANEL_TOKEN
 * is unset. Never throws; never awaited by callers.
 */
export function captureProductEvent(
  eventName: string,
  properties: Record<string, unknown> = {},
): void {
  if (!getMixpanelToken()) return;
  if (!isMixpanelEventName(eventName)) return;
  try {
    void postTrack(eventName, properties);
  } catch {
    // tracking must never break the app
  }
}

export function trackAcademySearchUsed(surface: string, query: string, resultCount?: number): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  captureProductEvent("academy_search_used", {
    surface,
    query_length: Math.min(trimmed.length, 200),
    result_count: typeof resultCount === "number" ? resultCount : undefined,
    page_path: "/learn",
  });
}

export function captureAppOpened(): void {
  captureProductEvent("app_opened", {
    platform: appMeta.platform,
    app_version: appMeta.app_version,
    source: "android",
    page_path: "/",
  });
}

/** Hydrate the install id, then emit app_opened. Safe to call more than once per process. */
export function initProductAnalytics(meta?: Partial<AppMeta>): void {
  if (meta) setAnalyticsAppMeta(meta);
  if (!getMixpanelToken()) return;
  void hydrateInstallId()
    .catch(() => undefined)
    .finally(() => {
      captureAppOpened();
    });
}
