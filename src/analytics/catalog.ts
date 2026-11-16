/**
 * Mixpanel product-event catalog, aligned with 25referTRM PR #1018.
 * Internal names stay local; this is the only set forwarded to Mixpanel.
 */

export const MIXPANEL_EVENTS = [
  "app_opened",
  "academy_course_viewed",
  "academy_lesson_started",
  "academy_lesson_completed",
  "academy_course_completed",
  "academy_search_used",
  "language_toggled",
  "signup_success",
  "login_success",
  "job_viewed",
  "job_applied",
] as const;

export type MixpanelEventName = (typeof MIXPANEL_EVENTS)[number];

const MIXPANEL_EVENT_SET = new Set<string>(MIXPANEL_EVENTS);

export const MIXPANEL_PROPERTY_ALLOWLIST = [
  "course_id",
  "lesson_id",
  "module_id",
  "category",
  "xp_earned",
  "method",
  "job_id",
  "company_id",
  "source",
  "surface",
  "language",
  "from_language",
  "to_language",
  "query_length",
  "result_count",
  "page_path",
  "app_version",
  "platform",
] as const;

export type MixpanelAllowedProperty = (typeof MIXPANEL_PROPERTY_ALLOWLIST)[number];

const PROPERTY_ALLOWLIST = new Set<string>(MIXPANEL_PROPERTY_ALLOWLIST);

const PII_KEY_PATTERN =
  /^(email|e-?mail|phone|mobile|tel|name|full_name|first_name|last_name|display_name|displayname|candidate_name|candidate_email|user_email|query|code|referral_code|password|token|title|job_title)$/i;

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_PATTERN = /\+?\d[\d\s()-]{7,}\d/;

export function isMixpanelEventName(value: string): value is MixpanelEventName {
  return MIXPANEL_EVENT_SET.has(value);
}

export function normalizeLanguage(value: unknown): "en" | "my" | null {
  if (value === "en") return "en";
  if (value === "my" || value === "mm") return "my";
  return null;
}

function asBoundedString(value: unknown, max = 80): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  if (!text || text.length > max) return null;
  if (EMAIL_PATTERN.test(text) || PHONE_PATTERN.test(text)) return null;
  return text.slice(0, max);
}

function asBoundedInt(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (rounded < min || rounded > max) return null;
  return rounded;
}

function sanitizeValue(key: string, value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (key === "from_language" || key === "to_language" || key === "language") {
    return normalizeLanguage(value);
  }
  if (key === "query_length" || key === "result_count" || key === "xp_earned") {
    return asBoundedInt(value, 0, 10_000);
  }
  if (key === "page_path" || key === "surface" || key === "category" || key === "app_version") {
    return asBoundedString(value, 200);
  }
  if (typeof value === "boolean") return value;
  return asBoundedString(value);
}

/**
 * Drop emails, phones, names, search text, and any key not on the allowlist.
 * `module_id` is copied onto `lesson_id` when lesson_id is absent.
 * `xp_gained` is accepted as an alias of `xp_earned`.
 */
export function sanitizeMixpanelProperties(
  input: Record<string, unknown> | null | undefined,
): Record<string, string | number | boolean> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};

  const raw: Record<string, unknown> = { ...input };
  if (raw.lesson_id == null && raw.module_id != null) raw.lesson_id = raw.module_id;
  if (raw.xp_earned == null && raw.xp_gained != null) raw.xp_earned = raw.xp_gained;

  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (PII_KEY_PATTERN.test(key)) continue;
    if (!PROPERTY_ALLOWLIST.has(key)) continue;
    const clean = sanitizeValue(key, value);
    if (clean === null) continue;
    out[key] = clean;
  }
  return out;
}

export function boundedDistinctId(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 128) return null;
  if (/@/.test(trimmed)) return null;
  if (/^\+?\d[\d\s()-]{6,}$/.test(trimmed)) return null;
  return trimmed;
}
