import type { AcademyModuleDetail, AcademyModuleListItem, Job, JobCompany, Json } from "./types";

export class MalformedResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MalformedResponseError";
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : null;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function toJson(value: unknown): Json {
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map(toJson);
  if (typeof value === "object") {
    const out: { [key: string]: Json } = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = toJson(nested);
    }
    return out;
  }
  return null;
}

function asJson(value: unknown): Json | null {
  if (value === undefined) return null;
  return toJson(value);
}

function parseCompany(raw: unknown): JobCompany | null {
  if (raw === null || raw === undefined) return null;
  const rec = asRecord(raw);
  if (!rec) return null;
  const id = asString(rec.id) ?? "";
  const name = asString(rec.name) ?? "";
  return {
    id,
    name,
    slug: asNullableString(rec.slug),
    logo: asNullableString(rec.logo),
    industry: asNullableString(rec.industry),
    location: asNullableString(rec.location),
    overallRating: asNullableNumber(rec.overallRating),
    tenantEnvironment: asNullableString(rec.tenantEnvironment),
  };
}

export function parseJobRecord(raw: unknown): Job | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const id = asString(rec.id)?.trim() ?? "";
  const title = asString(rec.title)?.trim() ?? "";
  const slug = asString(rec.slug)?.trim() ?? "";
  const status = asString(rec.status);
  if (!id || !title || !slug || status === null) return null;
  return {
    id,
    title,
    titleMm: asNullableString(rec.titleMm),
    slug,
    companyId: asString(rec.companyId) ?? "",
    description: asNullableString(rec.description),
    descriptionMm: asNullableString(rec.descriptionMm),
    requirements: asNullableString(rec.requirements),
    location: asNullableString(rec.location),
    locationMm: asNullableString(rec.locationMm),
    salaryMin: asNullableNumber(rec.salaryMin),
    salaryMax: asNullableNumber(rec.salaryMax),
    salaryDisplay: asNullableString(rec.salaryDisplay),
    reward: asNullableNumber(rec.reward),
    successFee: asNullableNumber(rec.successFee),
    type: asNullableString(rec.type),
    level: asNullableString(rec.level),
    skills: asNullableString(rec.skills),
    status,
    urgent: asBoolean(rec.urgent),
    featured: asBoolean(rec.featured),
    views: asNullableNumber(rec.views),
    createdAt: asString(rec.createdAt) ?? "",
    updatedAt: asNullableString(rec.updatedAt),
    expiresAt: asNullableString(rec.expiresAt),
    recruiterBrief: asNullableString(rec.recruiterBrief),
    recruiterBriefAt: asNullableString(rec.recruiterBriefAt),
    headcount: asNullableNumber(rec.headcount),
    shareCount: asNullableNumber(rec.shareCount),
    screeningQuestions: asJson(rec.screeningQuestions),
    postedAt: asNullableString(rec.postedAt),
    company: parseCompany(rec.company),
    _count: null,
  };
}

export function parseJobsEnvelope(raw: unknown): Job[] {
  const rec = asRecord(raw);
  if (!rec) throw new MalformedResponseError("jobs_envelope");
  if (!Object.prototype.hasOwnProperty.call(rec, "jobs")) throw new MalformedResponseError("jobs_missing");
  if (!Array.isArray(rec.jobs)) throw new MalformedResponseError("jobs_array");
  const out: Job[] = [];
  for (const row of rec.jobs) {
    const job = parseJobRecord(row);
    if (job) out.push(job);
  }
  return out;
}

export function parseModuleListItem(raw: unknown): AcademyModuleListItem | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const id = asString(rec.id)?.trim() ?? "";
  const slug = asString(rec.slug)?.trim() ?? "";
  const titleEn = asString(rec.titleEn)?.trim() ?? "";
  const category = asString(rec.category)?.trim() ?? "";
  if (!id || !slug || !titleEn) return null;
  return {
    id,
    titleEn,
    titleMm: asNullableString(rec.titleMm),
    category,
    durationMinutes: asNullableNumber(rec.durationMinutes),
    xpReward: asNullableNumber(rec.xpReward),
    level: asNullableString(rec.level),
    order: asNullableNumber(rec.order),
    slug,
    ksaFamily: asNullableString(rec.ksaFamily),
    ksaLevel: asNullableString(rec.ksaLevel),
    mmReady: asBoolean(rec.mmReady),
    quizCount: typeof rec.quizCount === "number" ? rec.quizCount : 0,
  };
}

export function parseAcademyEnvelope(raw: unknown): AcademyModuleListItem[] {
  const rec = asRecord(raw);
  if (!rec) throw new MalformedResponseError("academy_envelope");
  if (!Object.prototype.hasOwnProperty.call(rec, "modules")) throw new MalformedResponseError("modules_missing");
  if (!Array.isArray(rec.modules)) throw new MalformedResponseError("modules_array");
  const out: AcademyModuleListItem[] = [];
  for (const row of rec.modules) {
    const mod = parseModuleListItem(row);
    if (mod) out.push(mod);
  }
  return out;
}

export function parseModuleDetail(raw: unknown): AcademyModuleDetail | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const inner = asRecord(rec.module) ?? rec;
  const id = asString(inner.id)?.trim() ?? "";
  const slug = asString(inner.slug)?.trim() ?? "";
  const titleEn = asString(inner.titleEn)?.trim() ?? "";
  if (!id || !slug || !titleEn) return null;
  if (inner.isPublished === false) return null;
  return {
    id,
    slug,
    titleEn,
    titleMm: asNullableString(inner.titleMm),
    category: asString(inner.category) ?? "",
    durationMinutes: asNullableNumber(inner.durationMinutes),
    xpReward: asNullableNumber(inner.xpReward),
    content: asJson(inner.content),
    contentMm: asJson(inner.contentMm),
    mmContentReady: typeof inner.mmContentReady === "boolean" ? inner.mmContentReady : undefined,
    mmReady: typeof inner.mmReady === "boolean" ? inner.mmReady : undefined,
    isPublished: inner.isPublished === undefined ? undefined : inner.isPublished === true,
    quizQuestions: asJson(inner.quizQuestions),
    quizQuestionsMm: asJson(inner.quizQuestionsMm),
    furtherReadingUrl: asNullableString(inner.furtherReadingUrl),
    furtherReadingLabel: asNullableString(inner.furtherReadingLabel),
    hookTextMm: asNullableString(inner.hookTextMm),
    keyTakeawayMm: asNullableString(inner.keyTakeawayMm),
    commonMistakeMm: asNullableString(inner.commonMistakeMm),
    actionStepsMm: asNullableString(inner.actionStepsMm),
    decisionScenarioMm: asNullableString(inner.decisionScenarioMm),
    difficultyLevel: asNullableString(inner.difficultyLevel),
    learningObjectives: asJson(inner.learningObjectives),
  };
}

export function parseModuleEnvelope(raw: unknown): AcademyModuleDetail {
  const rec = asRecord(raw);
  if (!rec || !Object.prototype.hasOwnProperty.call(rec, "module")) {
    throw new MalformedResponseError("module_envelope");
  }
  const detail = parseModuleDetail(rec);
  if (!detail) throw new MalformedResponseError("module_body");
  return detail;
}
