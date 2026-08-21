import type { Job, JobListItem } from "./types";

const BODY_KEYS = [
  "description",
  "descriptionMm",
  "requirements",
  "recruiterBrief",
  "screeningQuestions",
] as const;

export function toListItem(job: Job): JobListItem {
  const item = { ...job } as Job & Record<string, unknown>;
  for (const key of BODY_KEYS) delete item[key];
  return item as JobListItem;
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
