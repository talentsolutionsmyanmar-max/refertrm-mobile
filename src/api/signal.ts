export class AbortedError extends Error {
  constructor() {
    super("aborted");
    this.name = "AbortError";
  }
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new AbortedError();
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof Error && (error.name === "AbortError" || error.name === "AbortedError")) ||
    (typeof error === "object" && error !== null && (error as { name?: string }).name === "AbortError")
  );
}

export function mergeSignals(user?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(20_000);
  if (!user) return timeout;
  if (typeof AbortSignal.any === "function") return AbortSignal.any([user, timeout]);
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (user.aborted || timeout.aborted) {
    controller.abort();
    return controller.signal;
  }
  user.addEventListener("abort", abort, { once: true });
  timeout.addEventListener("abort", abort, { once: true });
  return controller.signal;
}
