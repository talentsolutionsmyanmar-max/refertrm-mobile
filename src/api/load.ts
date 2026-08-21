import { catalog } from "../cache/catalog";
import { fetchAcademy, fetchJobs, fetchModule } from "./client";
import { isReadableModule, sanitizeJobs, sanitizeModules } from "./sanitize";
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

export async function loadJobs(): Promise<JobsLoad> {
  const cached = catalog.snapshot();
  try {
    const data = await fetchJobs();
    const jobs = sanitizeJobs(data.jobs ?? []);
    catalog.writeJobs(jobs);
    return { jobs, fromCache: false, syncedAt: Date.now() };
  } catch (error) {
    if (cached.jobs.length) {
      return { jobs: cached.jobs as Job[], fromCache: true, syncedAt: cached.jobsSyncedAt };
    }
    throw error;
  }
}

export async function loadAcademy(): Promise<AcademyLoad> {
  const cached = catalog.snapshot();
  try {
    const data = await fetchAcademy();
    const modules = sanitizeModules(data.modules ?? []);
    catalog.writeAcademy(modules);
    return { modules, fromCache: false, syncedAt: Date.now() };
  } catch (error) {
    if (cached.modules.length) {
      return { modules: cached.modules, fromCache: true, syncedAt: cached.academySyncedAt };
    }
    throw error;
  }
}

export async function loadModule(id: string): Promise<AcademyModuleDetail> {
  const cached = catalog.findModuleBody(id);
  try {
    const data = await fetchModule(id);
    const module = data.module;
    if (!isReadableModule(module)) {
      throw new Error("unpublished");
    }
    catalog.writeModule(module);
    return module;
  } catch (error) {
    if (cached && isReadableModule(cached)) return cached;
    throw error;
  }
}
