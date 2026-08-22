import type { Job, JobListItem } from "./types";

const BODY_KEYS = [
  "description",
  "descriptionMm",
  "requirements",
  "recruiterBrief",
  "screeningQuestions",
] as const;

function nonempty(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function toListItem(job: Job | JobListItem): JobListItem {
  const rec = job as Job & JobListItem & Record<string, unknown>;
  const item = { ...rec };
  for (const key of BODY_KEYS) delete item[key];
  item.hasDescription =
    typeof rec.hasDescription === "boolean" ? rec.hasDescription : nonempty(rec.description);
  item.hasRequirements =
    typeof rec.hasRequirements === "boolean" ? rec.hasRequirements : nonempty(rec.requirements);
  return item as JobListItem;
}

export function usefulJobBody(
  job: Job | (JobListItem & { description?: string | null; requirements?: string | null }),
): { description: string | null; requirements: string | null } | null {
  const rec = job as { description?: unknown; requirements?: unknown };
  const description =
    typeof rec.description === "string" ? rec.description : rec.description === null ? null : undefined;
  const requirements =
    typeof rec.requirements === "string" ? rec.requirements : rec.requirements === null ? null : undefined;
  if (description === undefined && requirements === undefined) return null;
  const body = {
    description: description ?? null,
    requirements: requirements ?? null,
  };
  if (!nonempty(body.description) && !nonempty(body.requirements)) return null;
  return body;
}

export function jobTypeLabel(type: string | null): string | null {
  if (!type) return null;
  const map: Record<string, string> = {
    full_time: "Full time",
    part_time: "Part time",
    contract: "Contract",
    internship: "Internship",
    temporary: "Temporary",
  };
  return map[type] ?? type.replaceAll("_", " ");
}
