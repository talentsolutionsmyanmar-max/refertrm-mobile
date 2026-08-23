export type JobFieldState = "text" | "empty" | "unavailable";

export type ResolvedJobField = {
  state: JobFieldState;
  text: string | null;
};

function trimmed(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Successful live/cache body (including null) is source of truth.
 * List hasDescription/hasRequirements only decides empty vs unavailable when no body exists.
 */
export function resolveJobField(args: {
  loadedValue?: string | null;
  loaded: boolean;
  cachedValue?: string | null;
  cached: boolean;
  listed?: boolean;
}): ResolvedJobField {
  if (args.loaded) {
    const text = trimmed(args.loadedValue);
    return text ? { state: "text", text: args.loadedValue ?? text } : { state: "empty", text: null };
  }
  if (args.cached) {
    const text = trimmed(args.cachedValue);
    return text ? { state: "text", text: args.cachedValue ?? text } : { state: "empty", text: null };
  }
  if (args.listed === false) return { state: "empty", text: null };
  return { state: "unavailable", text: null };
}
