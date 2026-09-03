const MAX_LEN = 160;
const ALLOWED = /^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/;

export function decodeSegment(raw: string): string | null {
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

export function isAllowedSegment(value: string): boolean {
  if (!value || value.length > MAX_LEN) return false;
  if (value === "." || value === "..") return false;
  if (value.includes("..")) return false;
  if (/[\u0000-\u001f\u007f/\\?#[\]@]/.test(value)) return false;
  return ALLOWED.test(value);
}

export function parseRouteSegment(raw: string | undefined | null): string | null {
  if (typeof raw !== "string" || !raw) return null;
  if (/%(?:2f|5c)/i.test(raw)) return null;
  const decoded = decodeSegment(raw);
  if (decoded === null) return null;
  if (!isAllowedSegment(decoded)) return null;
  return decoded;
}

export function isLikelyModuleId(value: string): boolean {
  return /^c[a-z0-9]{8,40}$/i.test(value) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
