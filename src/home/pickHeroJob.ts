import type { JobListItem } from "../api/types";

/**
 * Stratified hero bands — Manager → Mid → Entry → Senior.
 * Live Job.level is Mid/Entry/Senior (case-inconsistent); Manager is a TITLE overlay.
 * Exhaustive on production: every active row classifies into one of these four.
 */
export type HeroBand = "manager" | "mid" | "entry" | "senior";

export const HERO_BAND_ORDER: readonly HeroBand[] = ["manager", "mid", "entry", "senior"] as const;

/** Title overlay — checked FIRST so "Senior Manager" / "Mid Manager" land in manager. */
const MANAGER_TITLE = /\b(manager|general\s*manager|gm|head\s*of|director|chief)\b/i;

export function classifyJobBand(job: JobListItem): HeroBand | null {
  const title = job.title ?? "";
  if (MANAGER_TITLE.test(title)) return "manager";

  const level = (job.level ?? "").trim().toLowerCase();
  if (level === "mid") return "mid";
  if (level === "entry") return "entry";
  if (level === "senior") return "senior";
  return null;
}

/**
 * Second-granularity seed for mount-time hero pick.
 * Home holds this in a useRef so it is stable for one mount (no remount flicker)
 * but a cold start or remount gets a new seed. Strict band order across launches
 * is not guaranteed without persisted state (not authorised on the launch path).
 */
export function heroSeed(nowMs: number = Date.now()): number {
  return Math.floor(nowMs / 1_000);
}

export function bandForSeed(seed: number): HeroBand {
  const i = ((seed % HERO_BAND_ORDER.length) + HERO_BAND_ORDER.length) % HERO_BAND_ORDER.length;
  return HERO_BAND_ORDER[i]!;
}

export function bandIndex(band: HeroBand): number {
  return HERO_BAND_ORDER.indexOf(band);
}

/**
 * Pick one role for the hero from the preferred band (then next bands).
 * Within a band, index by Math.floor(seed / 4) so consecutive band cycles advance roles.
 * Deterministic — no Math.random.
 */
export function pickHeroJob(jobs: JobListItem[], seed: number): JobListItem | null {
  if (jobs.length === 0) return null;
  const preferred = bandForSeed(seed);
  const start = HERO_BAND_ORDER.indexOf(preferred);
  const within = Math.floor(seed / HERO_BAND_ORDER.length);

  for (let offset = 0; offset < HERO_BAND_ORDER.length; offset++) {
    const band = HERO_BAND_ORDER[(start + offset) % HERO_BAND_ORDER.length]!;
    const matches = jobs.filter((j) => classifyJobBand(j) === band);
    if (matches.length > 0) {
      return matches[((within % matches.length) + matches.length) % matches.length]!;
    }
  }
  return jobs[0] ?? null;
}
