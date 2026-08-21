/** Per-resource monotonic tickets. A newer issue makes older completions ineligible. */

export type Generation = {
  issue: () => number;
  apply: (ticket: number) => boolean;
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
      if (ticket !== issued) return false;
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

export const jobsGeneration = createGeneration();
export const academyGeneration = createGeneration();
export const moduleGeneration = createGeneration();

export function resetGenerations(): void {
  jobsGeneration.reset();
  academyGeneration.reset();
  moduleGeneration.reset();
}
