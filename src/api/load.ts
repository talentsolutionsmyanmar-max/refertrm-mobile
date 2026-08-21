import { catalog } from "../cache/catalog";
import { academyGeneration, jobsGeneration, moduleGeneration } from "../cache/generation";
import { fetchAcademy, fetchJobs, fetchModule } from "./client";
import { MalformedResponseError, parseAcademyEnvelope, parseJobsEnvelope, parseModuleEnvelope } from "./parse";
import { isReadableModule, sanitizeJobs, sanitizeModules } from "./sanitize";
import { isAbortError, throwIfAborted } from "./signal";
import type { AcademyModuleDetail, AcademyModuleListItem, Job } from "./types";

export type JobsLoad = {
  jobs: Job[];
  fromCache: boolean;
  syncedAt: number | null;
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

export async function loadJobs(signal?: AbortSignal): Promise<JobsLoad> {
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
      return { jobs: latest.jobs as Job[], fromCache, syncedAt: latest.jobsSyncedAt };
    }
    catalog.writeJobs(jobs);
    return { jobs, fromCache: false, syncedAt: Date.now() };
  } catch (error) {
    if (isAbortError(error)) throw error;
    if (cached.jobsSyncedAt != null) {
      return { jobs: cached.jobs as Job[], fromCache: true, syncedAt: cached.jobsSyncedAt };
    }
    throw error;
  }
}

export async function loadAcademy(signal?: AbortSignal): Promise<AcademyLoad> {
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
