/** Per-resource monotonic tickets. Only a higher successful apply wins. */

export type Generation = {
  issue: () => number;
  apply: (ticket: number) => boolean;
  reset: () => void;
};

export type KeyedGeneration = {
  issue: (key: string) => number;
  apply: (key: string, ticket: number) => boolean;
  reset: () => void;
};

export type CanonicalCommit = {
  issue: () => number;
  commit: (canonicalId: string, ordinal: number) => boolean;
  reset: () => void;
};

export function createGeneration(): Generation {
  let issued = 0;
  let applied = 0;
  return {
    issue() {
      issued += 1;
      return issued;
    },
    apply(ticket: number) {
      if (ticket <= applied) return false;
      applied = ticket;
      return true;
    },
    reset() {
      issued = 0;
      applied = 0;
    },
  };
}

export function createKeyedGeneration(): KeyedGeneration {
  const byKey = new Map<string, Generation>();
  const of = (key: string) => {
    const existing = byKey.get(key);
    if (existing) return existing;
    const created = createGeneration();
    byKey.set(key, created);
    return created;
  };
  return {
    issue: (key) => of(key).issue(),
    apply: (key, ticket) => of(key).apply(ticket),
    reset() {
      byKey.clear();
    },
  };
}

export function createCanonicalCommit(): CanonicalCommit {
  let issued = 0;
  const committed = new Map<string, number>();
  return {
    issue() {
      issued += 1;
      return issued;
    },
    commit(canonicalId: string, ordinal: number) {
      const last = committed.get(canonicalId) ?? 0;
      if (ordinal <= last) return false;
      committed.set(canonicalId, ordinal);
      return true;
    },
    reset() {
      issued = 0;
      committed.clear();
    },
  };
}

export const jobsGeneration = createGeneration();
export const academyGeneration = createGeneration();
export const moduleGeneration = createKeyedGeneration();
export const jobDetailGeneration = createKeyedGeneration();
export const jobCanonicalCommit = createCanonicalCommit();

export function resetGenerations(): void {
  jobsGeneration.reset();
  academyGeneration.reset();
  moduleGeneration.reset();
  jobDetailGeneration.reset();
  jobCanonicalCommit.reset();
}
