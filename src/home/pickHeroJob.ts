import type { JobListItem } from "../api/types";

/** Stratified hero bands — Manager → Entry → Senior. Never random. */
export type HeroBand = "manager" | "entry" | "senior";

export const HERO_BAND_ORDER: readonly HeroBand[] = ["manager", "entry", "senior"] as const;

const BAND_MATCH: Record<HeroBand, RegExp> = {
  manager: /\b(manager|gm|general\s*manager|head\s*of|director)\b/i,
  entry: /\b(entry|junior|intern|trainee|associate|assistant)\b/i,
  senior: /\b(senior|lead|principal|specialist)\b/i,
};

export function classifyJobBand(job: JobListItem): HeroBand | null {
  const hay = `${job.level ?? ""} ${job.title ?? ""}`.trim();
  if (!hay) return null;
  // Manager before senior so "Senior Manager" lands in manager.
  if (BAND_MATCH.manager.test(hay)) return "manager";
  if (BAND_MATCH.senior.test(hay)) return "senior";
  if (BAND_MATCH.entry.test(hay)) return "entry";
  return null;
}

export function bandForVisit(visitIndex: number): HeroBand {
  const i = ((visitIndex % HERO_BAND_ORDER.length) + HERO_BAND_ORDER.length) % HERO_BAND_ORDER.length;
  return HERO_BAND_ORDER[i]!;
}

/**
 * Pick one role for the hero: preferred band for this visit, else next bands,
 * else first list item. Deterministic — no Math.random.
 */
export function pickHeroJob(jobs: JobListItem[], visitIndex: number): JobListItem | null {
  if (jobs.length === 0) return null;
  const preferred = bandForVisit(visitIndex);
  const start = HERO_BAND_ORDER.indexOf(preferred);
  for (let offset = 0; offset < HERO_BAND_ORDER.length; offset++) {
    const band = HERO_BAND_ORDER[(start + offset) % HERO_BAND_ORDER.length]!;
    const hit = jobs.find((j) => classifyJobBand(j) === band);
    if (hit) return hit;
  }
  return jobs[0] ?? null;
}
