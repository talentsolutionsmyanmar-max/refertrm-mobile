/** Device-local nickname — never sent to an API. Cap includes strip of newlines. */

export const NICKNAME_MAX = 24;

export type NicknameBackend = {
  read(): Promise<string | undefined>;
  write(value: string): Promise<void>;
  remove(): Promise<void>;
};

const memoryStore = new Map<string, string>();
const MEMORY_KEY = "nickname";

/** In-memory backend for Node tests (same contract as the FileSystem layer). */
export const memoryNicknameBackend: NicknameBackend = {
  async read() {
    return memoryStore.get(MEMORY_KEY);
  },
  async write(value) {
    memoryStore.set(MEMORY_KEY, value);
  },
  async remove() {
    memoryStore.delete(MEMORY_KEY);
  },
};

let backend: NicknameBackend = memoryNicknameBackend;

export function setNicknameBackend(next: NicknameBackend): void {
  backend = next;
}

/** Test-only reset. */
export function setNicknameBackendForTests(next: NicknameBackend): void {
  backend = next;
  memoryStore.clear();
}

export function resetNicknameBackendForTests(): void {
  backend = memoryNicknameBackend;
  memoryStore.clear();
}

/** Trim, strip newlines, hard-cap at 24. Empty/whitespace → "". */
export function normalizeNickname(input: string): string {
  return input.replace(/[\r\n]+/g, "").trim().slice(0, NICKNAME_MAX).trim();
}

/** "Good morning." + "KoKo" → "Good morning, KoKo." Empty name leaves the period form. */
export function formatGreeting(baseGreeting: string, name: string | null): string {
  if (!name) return baseGreeting;
  return baseGreeting.replace(/\.$/, `, ${name}.`);
}

export async function hydrateNickname(): Promise<string | null> {
  const raw = await backend.read();
  if (raw == null) return null;
  const n = normalizeNickname(raw);
  return n || null;
}

/** Persist trimmed name, or clear when empty/whitespace. Returns stored name or null. */
export async function persistNickname(input: string): Promise<string | null> {
  const n = normalizeNickname(input);
  if (!n) {
    await backend.remove();
    return null;
  }
  await backend.write(n);
  return n;
}
