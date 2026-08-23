import type { AcademyModuleDetail, AcademyModuleListItem, Job } from "./types";

type PublicJobLike = Pick<Job, "id" | "title" | "slug" | "status"> & {
  company?: Job["company"];
};

/**
 * Fail closed. Only explicit case-insensitive status === "active" is public.
 * Missing/null/empty/unknown status is rejected. Demo/test tenants are rejected.
 * A legitimate live row may omit tenantEnvironment.
 */
export function isPublicJob(job: PublicJobLike): boolean {
  if (typeof job.status !== "string") return false;
  if (job.status.trim().toLowerCase() !== "active") return false;

  const title = (job.title ?? "").trim();
  const slug = (job.slug ?? "").trim();
  if (!job.id || !title || !slug) return false;

  const env = job.company?.tenantEnvironment;
  if (typeof env === "string") {
    const tenant = env.trim().toLowerCase();
    if (tenant === "demo" || tenant === "test") return false;
  }

  const company = (job.company?.name ?? "").trim().toLowerCase();
  if (company === "demo" || company === "dummy") return false;
  if (/^\[(demo|fixture)\]/i.test(title)) return false;
  if (/^(demo|fixture)[:\-]/i.test(title)) return false;
  if (slug.startsWith("demo-") || slug.includes("-fixture-")) return false;
  return true;
}

export function sanitizeJobs<T extends PublicJobLike>(jobs: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
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
  return Boolean(detail.id && detail.slug && detail.titleEn);
}
