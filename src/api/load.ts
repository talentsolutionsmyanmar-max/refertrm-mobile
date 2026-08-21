import { catalog } from "../cache/catalog";
import { academyGeneration, jobsGeneration, moduleGeneration } from "../cache/generation";
import { fetchAcademy, fetchJobs, fetchModule } from "./client";
import { parseAcademyEnvelope, parseJobsEnvelope, parseModuleEnvelope } from "./parse";
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

export async function loadJobs(signal?: AbortSignal): Promise<JobsLoad> {
  const ticket = jobsGeneration.issue();
  const cached = catalog.snapshot();
  try {
    throwIfAborted(signal);
    const raw = await fetchJobs(signal);
    throwIfAborted(signal);
    const jobs = sanitizeJobs(parseJobsEnvelope(raw));
    throwIfAborted(signal);
    if (!jobsGeneration.apply(ticket)) {
      const latest = catalog.snapshot();
      return { jobs: latest.jobs as Job[], fromCache: false, syncedAt: latest.jobsSyncedAt };
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
    const modules = sanitizeModules(parseAcademyEnvelope(raw));
    throwIfAborted(signal);
    if (!academyGeneration.apply(ticket)) {
      const latest = catalog.snapshot();
      return { modules: latest.modules, fromCache: false, syncedAt: latest.academySyncedAt };
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
  const ticket = moduleGeneration.issue();
  const cached = catalog.findModuleBody(id);
  try {
    throwIfAborted(signal);
    const raw = await fetchModule(id, signal);
    throwIfAborted(signal);
    const module = parseModuleEnvelope(raw);
    if (!isReadableModule(module)) throw new Error("unpublished");
    throwIfAborted(signal);
    if (!moduleGeneration.apply(ticket)) {
      const latest = catalog.findModuleBody(id);
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
