export const REQUEST_TIMEOUT_MS = 45_000;

export class AbortedError extends Error {
  constructor() {
    super("aborted");
    this.name = "AbortError";
  }
}

export class TimeoutError extends Error {
  constructor() {
    super("timeout");
    this.name = "TimeoutError";
  }
}

export class TransportError extends Error {
  constructor(cause?: unknown) {
    super("transport");
    this.name = "TransportError";
    if (cause !== undefined) (this as Error & { cause?: unknown }).cause = cause;
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

export function isTimeoutError(error: unknown): boolean {
  return error instanceof TimeoutError || (error instanceof Error && error.name === "TimeoutError");
}

export function isTransportError(error: unknown): boolean {
  return error instanceof TransportError || (error instanceof Error && error.name === "TransportError");
}

export function isNativeTransportFailure(error: unknown): boolean {
  if (isTimeoutError(error) || isAbortError(error) || isTransportError(error)) return false;
  if (error instanceof TypeError) return true;
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("failed to fetch") ||
      message.includes("network request failed") ||
      message.includes("network error")
    );
  }
  return false;
}

export type ManagedSignal = {
  signal: AbortSignal;
  cleanup: () => void;
  timedOut: () => boolean;
};

/** RN 0.81.5 abort-controller 3.0.0 has no static timeout() or any(). */
export function createRequestSignal(
  user?: AbortSignal,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): ManagedSignal {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cleaned = false;
  let timedOut = false;

  const onUserAbort = () => {
    controller.abort();
  };

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    user?.removeEventListener("abort", onUserAbort);
  };

  if (user?.aborted) {
    controller.abort();
    return { signal: controller.signal, cleanup, timedOut: () => false };
  }

  if (user) {
    user.addEventListener("abort", onUserAbort);
  }

  timer = setTimeout(() => {
    timer = undefined;
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  return { signal: controller.signal, cleanup, timedOut: () => timedOut };
}
