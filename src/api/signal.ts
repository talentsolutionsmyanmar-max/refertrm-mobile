export const REQUEST_TIMEOUT_MS = 20_000;

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

export type ManagedSignal = {
  signal: AbortSignal;
  cleanup: () => void;
};

/** RN 0.81.5 abort-controller 3.0.0 has no static timeout() or any(). */
export function createRequestSignal(
  user?: AbortSignal,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): ManagedSignal {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cleaned = false;

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
    return { signal: controller.signal, cleanup };
  }

  if (user) {
    user.addEventListener("abort", onUserAbort);
  }

  timer = setTimeout(() => {
    timer = undefined;
    controller.abort();
  }, timeoutMs);

  return { signal: controller.signal, cleanup };
}
