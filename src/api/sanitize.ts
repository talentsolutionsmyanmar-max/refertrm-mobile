import type { AcademyModuleDetail, AcademyModuleListItem, Job } from "./types";

/**
 * Public list can theoretically include inactive or fixture rows.
 * Do not treat the word "test" inside a real title (e.g. Test Engineer) as a fixture.
 */
export function isPublicJob(job: Job): boolean {
  const status = (job.status ?? "active").toLowerCase();
  if (status !== "active") return false;

  const slug = (job.slug ?? "").toLowerCase();
  const title = (job.title ?? "").trim();
  const company = (job.company?.name ?? "").trim().toLowerCase();

  if (!job.id || !title) return false;
  if (company === "demo" || company === "test" || company === "dummy" || company.includes("dummy company")) {
    return false;
  }
  if (slug.startsWith("demo-") || slug.startsWith("test-") || slug.includes("-demo-") || slug.includes("-fixture-")) {
    return false;
  }
  if (/^\[(demo|test|fixture)\]/i.test(title)) return false;
  if (/^(demo|test|fixture)[:\-]/i.test(title)) return false;
  return true;
}

export function sanitizeJobs(jobs: Job[]): Job[] {
  const seen = new Set<string>();
  const out: Job[] = [];
  for (const job of jobs) {
    if (!isPublicJob(job)) continue;
    if (seen.has(job.id)) continue;
    seen.add(job.id);
    out.push(job);
  }
  return out;
}

export function isPublishedModule(mod: Pick<AcademyModuleListItem, "id" | "slug" | "titleEn">): boolean {
  return Boolean(mod.id && mod.slug && mod.titleEn);
}

export function sanitizeModules(modules: AcademyModuleListItem[]): AcademyModuleListItem[] {
  const seen = new Set<string>();
  const out: AcademyModuleListItem[] = [];
  for (const mod of modules) {
    if (!isPublishedModule(mod)) continue;
    if (seen.has(mod.id)) continue;
    seen.add(mod.id);
    out.push(mod);
  }
  return out;
}

export function isReadableModule(detail: AcademyModuleDetail | null | undefined): boolean {
  if (!detail) return false;
  if (detail.isPublished === false) return false;
  return Boolean(detail.id && detail.slug);
}
