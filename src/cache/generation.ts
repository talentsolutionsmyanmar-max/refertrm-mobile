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

export const jobsGeneration = createGeneration();
export const academyGeneration = createGeneration();
export const moduleGeneration = createKeyedGeneration();
export const jobDetailGeneration = createKeyedGeneration();

export function resetGenerations(): void {
  jobsGeneration.reset();
  academyGeneration.reset();
  moduleGeneration.reset();
  jobDetailGeneration.reset();
}
