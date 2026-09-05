import { catalog } from "../cache/catalog";
import { hydrateCatalogFromFile, persistCatalogToFile } from "../storage/fileKv";
import { academyGeneration, jobCanonicalCommit, jobDetailGeneration, jobsGeneration, moduleGeneration } from "../cache/generation";
import { fetchAcademy, fetchJob, fetchJobs, fetchModule } from "./client";
import {
  MalformedResponseError,
  parseAcademyEnvelope,
  parseJobDetailEnvelope,
  parseJobsEnvelope,
  parseModuleEnvelope,
} from "./parse";
import { isPublicJob, isReadableModule, sanitizeJobs, sanitizeModules } from "./sanitize";
import { isAbortError, throwIfAborted } from "./signal";
import type { AcademyModuleDetail, AcademyModuleListItem, Job, JobListItem } from "./types";

export type JobsLoad = {
  jobs: JobListItem[];
  fromCache: boolean;
  syncedAt: number | null;
};

export type JobDetailLoad = {
  job: Job;
  fromCache: boolean;
};

export type AcademyLoad = {
  modules: AcademyModuleListItem[];
  fromCache: boolean;
  syncedAt: number | null;
};

function rejectAllUnsafe<T>(parsed: T[], kept: T[], kind: string): T[] {
  if (parsed.length > 0 && kept.length === 0) {
    throw new MalformedResponseError(`${kind}_all_rejected`);
  }
  return kept;
}

function composeJob(meta: JobListItem | undefined, body: { description: string | null; requirements: string | null }, fallback?: Job): Job {
  if (fallback) {
    return { ...fallback, description: body.description, requirements: body.requirements };
  }
  if (!meta) {
    throw new Error("missing_job");
  }
  return {
    id: meta.id,
    title: meta.title,
    titleMm: null,
    slug: meta.slug,
    companyId: meta.companyId,
    description: body.description,
    descriptionMm: null,
    requirements: body.requirements,
    location: meta.location,
    locationMm: null,
    salaryMin: meta.salaryMin,
    salaryMax: meta.salaryMax,
    salaryDisplay: meta.salaryDisplay,
    reward: null,
    successFee: null,
    type: meta.type,
    level: meta.level,
    skills: meta.skills,
    status: meta.status,
    urgent: meta.urgent,
    featured: meta.featured,
    views: null,
    createdAt: meta.createdAt,
    updatedAt: null,
    expiresAt: null,
    recruiterBrief: null,
    recruiterBriefAt: null,
    headcount: null,
    shareCount: null,
    screeningQuestions: null,
    postedAt: meta.postedAt,
    company: meta.company,
    _count: meta._count,
  };
}

export async function loadJobs(signal?: AbortSignal): Promise<JobsLoad> {
  await hydrateCatalogFromFile();
  const ticket = jobsGeneration.issue();
  const cached = catalog.snapshot();
  try {
    throwIfAborted(signal);
    const raw = await fetchJobs(signal);
    throwIfAborted(signal);
    const parsed = parseJobsEnvelope(raw);
    const jobs = rejectAllUnsafe(parsed, sanitizeJobs(parsed), "jobs");
    throwIfAborted(signal);
    if (!jobsGeneration.apply(ticket)) {
      const latest = catalog.snapshot();
      const fromCache = latest.jobsSyncedAt === cached.jobsSyncedAt;
      return { jobs: latest.jobs, fromCache, syncedAt: latest.jobsSyncedAt };
    }
    catalog.writeJobs(jobs);
    void persistCatalogToFile();
    return { jobs, fromCache: false, syncedAt: Date.now() };
  } catch (error) {
    if (isAbortError(error)) throw error;
    if (cached.jobsSyncedAt != null) {
      return { jobs: cached.jobs, fromCache: true, syncedAt: cached.jobsSyncedAt };
    }
    throw error;
  }
}

export async function loadJob(id: string, signal?: AbortSignal): Promise<JobDetailLoad> {
  const ticket = jobDetailGeneration.issue(id);
  const ordinal = jobCanonicalCommit.issue();
  const cachedBody = catalog.findJobBody(id);
  const cachedMeta = catalog.findJob(id);
  try {
    throwIfAborted(signal);
    const raw = await fetchJob(id, signal);
    throwIfAborted(signal);
    const job = parseJobDetailEnvelope(raw);
    if (!isPublicJob(job)) throw new Error("unpublished");
    throwIfAborted(signal);
    if (!jobDetailGeneration.apply(id, ticket)) {
      const latest = catalog.findJobBody(job.id) ?? catalog.findJobBody(id);
      if (latest) return { job: composeJob(catalog.findJob(job.id) ?? cachedMeta, latest, job), fromCache: true };
      return { job, fromCache: false };
    }
    if (!jobCanonicalCommit.commit(job.id, ordinal)) {
      const latest = catalog.findJobBody(job.id) ?? catalog.findJobBody(id);
      if (latest) return { job: composeJob(catalog.findJob(job.id) ?? cachedMeta, latest, job), fromCache: true };
      return { job, fromCache: false };
    }
    catalog.writeJobBody(job);
    return { job, fromCache: false };
  } catch (error) {
    if (isAbortError(error)) throw error;
    const latest = catalog.findJobBody(id) ?? cachedBody;
    const meta = catalog.findJob(id) ?? cachedMeta;
    if (latest && meta) return { job: composeJob(meta, latest), fromCache: true };
    throw error;
  }
}

export async function loadAcademy(signal?: AbortSignal): Promise<AcademyLoad> {
  await hydrateCatalogFromFile();
  const ticket = academyGeneration.issue();
  const cached = catalog.snapshot();
  try {
    throwIfAborted(signal);
    const raw = await fetchAcademy(signal);
    throwIfAborted(signal);
    const parsed = parseAcademyEnvelope(raw);
    const modules = rejectAllUnsafe(parsed, sanitizeModules(parsed), "modules");
    throwIfAborted(signal);
    if (!academyGeneration.apply(ticket)) {
      const latest = catalog.snapshot();
      const fromCache = latest.academySyncedAt === cached.academySyncedAt;
      return { modules: latest.modules, fromCache, syncedAt: latest.academySyncedAt };
    }
    catalog.writeAcademy(modules);
    void persistCatalogToFile();
    return { modules, fromCache: false, syncedAt: Date.now() };
  } catch (error) {
    if (isAbortError(error)) throw error;
    if (cached.academySyncedAt != null) {
      return { modules: cached.modules, fromCache: true, syncedAt: cached.academySyncedAt };
    }
    throw error;
  }
}

export async function loadModule(id: string, signal?: AbortSignal): Promise<AcademyModuleDetail> {
  const ticket = moduleGeneration.issue(id);
  const cached = catalog.findModuleBody(id);
  try {
    throwIfAborted(signal);
    const raw = await fetchModule(id, signal);
    throwIfAborted(signal);
    const module = parseModuleEnvelope(raw);
    if (!isReadableModule(module)) throw new Error("unpublished");
    throwIfAborted(signal);
    if (!moduleGeneration.apply(id, ticket)) {
      const latest = catalog.findModuleBody(id) ?? catalog.findModuleBody(module.id);
      if (latest && isReadableModule(latest)) return latest;
      return module;
    }
    catalog.writeModule(module);
    return module;
  } catch (error) {
    if (isAbortError(error)) throw error;
    if (cached && isReadableModule(cached)) return cached;
    throw error;
  }
}
