import type { AcademyModuleListItem, JobListItem } from "./types";

export type JobPlace = "all" | "yangon" | "mandalay" | "remote" | "urgent";

export function filterJobs(
  jobs: JobListItem[],
  query: string,
  place: JobPlace,
): JobListItem[] {
  const q = query.trim().toLowerCase();
  return jobs.filter((job) => {
    if (place === "urgent" && !job.urgent) return false;
    const loc = (job.location ?? "").toLowerCase();
    if (place === "yangon" && !loc.includes("yangon")) return false;
    if (place === "mandalay" && !loc.includes("mandalay")) return false;
    if (place === "remote" && !loc.includes("remote")) return false;
    if (!q) return true;
    const hay = [
      job.title,
      job.company?.name,
      job.location,
      job.skills,
      job.type,
      job.level,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function filterModules(
  modules: AcademyModuleListItem[],
  query: string,
  category: string | "all",
  myanmarOnly: boolean,
): AcademyModuleListItem[] {
  const q = query.trim().toLowerCase();
  return modules.filter((mod) => {
    if (myanmarOnly && !mod.mmReady) return false;
    if (category !== "all" && mod.category !== category) return false;
    if (!q) return true;
    const hay = [mod.titleEn, mod.titleMm, mod.category, mod.ksaFamily]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function uniqueCategories(modules: AcademyModuleListItem[]): string[] {
  return [...new Set(modules.map((m) => m.category).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}
