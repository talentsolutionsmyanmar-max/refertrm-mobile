import { getKv } from "../storage/kv";
import { toListItem } from "../api/project";
import type { AcademyModuleDetail, AcademyModuleListItem, Job, JobListItem } from "../api/types";

const KEY = "refertrm.p1.catalog.v1";
const MAX_JOB_BODIES = 25;
const MAX_MODULE_BODIES = 15;

export type JobBody = {
  description: string | null;
  requirements: string | null;
};

export type CatalogSnapshot = {
  jobs: JobListItem[];
  jobBodies: Record<string, JobBody>;
  jobBodyOrder: string[];
  modules: AcademyModuleListItem[];
  moduleBodies: Record<string, AcademyModuleDetail>;
  moduleBodyOrder: string[];
  jobsSyncedAt: number | null;
  academySyncedAt: number | null;
};

const empty = (): CatalogSnapshot => ({
  jobs: [],
  jobBodies: {},
  jobBodyOrder: [],
  modules: [],
  moduleBodies: {},
  moduleBodyOrder: [],
  jobsSyncedAt: null,
  academySyncedAt: null,
});

function read(): CatalogSnapshot {
  const raw = getKv().getString(KEY);
  if (!raw) return empty();
  try {
    const parsed = JSON.parse(raw) as CatalogSnapshot;
    return {
      ...empty(),
      ...parsed,
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      jobBodies: parsed.jobBodies ?? {},
      jobBodyOrder: parsed.jobBodyOrder ?? [],
      modules: Array.isArray(parsed.modules) ? parsed.modules : [],
      moduleBodies: parsed.moduleBodies ?? {},
      moduleBodyOrder: parsed.moduleBodyOrder ?? [],
    };
  } catch {
    return empty();
  }
}

function write(next: CatalogSnapshot): CatalogSnapshot {
  getKv().set(KEY, JSON.stringify(next));
  return next;
}

function lruSet<T>(
  map: Record<string, T>,
  order: string[],
  key: string,
  value: T,
  max: number,
): { map: Record<string, T>; order: string[] } {
  const nextMap = { ...map, [key]: value };
  const nextOrder = [...order.filter((k) => k !== key), key];
  while (nextOrder.length > max) {
    const drop = nextOrder.shift();
    if (drop) delete nextMap[drop];
  }
  return { map: nextMap, order: nextOrder };
}

export const catalog = {
  snapshot: read,
  writeJobs(jobs: Job[]): CatalogSnapshot {
    const current = read();
    return write({
      ...current,
      jobs: jobs.map(toListItem),
      jobsSyncedAt: Date.now(),
    });
  },
  writeJobBody(job: Job): CatalogSnapshot {
    const current = read();
    const body: JobBody = {
      description: job.description,
      requirements: job.requirements,
    };
    const stored = lruSet(current.jobBodies, current.jobBodyOrder, job.id, body, MAX_JOB_BODIES);
    return write({
      ...current,
      jobBodies: stored.map,
      jobBodyOrder: stored.order,
    });
  },
  writeAcademy(modules: AcademyModuleListItem[]): CatalogSnapshot {
    const current = read();
    return write({
      ...current,
      modules,
      academySyncedAt: Date.now(),
    });
  },
  writeModule(module: AcademyModuleDetail): CatalogSnapshot {
    const current = read();
    const stored = lruSet(current.moduleBodies, current.moduleBodyOrder, module.id, module, MAX_MODULE_BODIES);
    return write({
      ...current,
      moduleBodies: stored.map,
      moduleBodyOrder: stored.order,
    });
  },
  findJob(id: string): JobListItem | undefined {
    return read().jobs.find((job) => job.id === id || job.slug === id);
  },
  findJobBody(id: string): JobBody | undefined {
    const snap = read();
    if (snap.jobBodies[id]) return snap.jobBodies[id];
    const meta = snap.jobs.find((job) => job.id === id || job.slug === id);
    return meta ? snap.jobBodies[meta.id] : undefined;
  },
  findModule(idOrSlug: string): AcademyModuleListItem | undefined {
    return read().modules.find((mod) => mod.id === idOrSlug || mod.slug === idOrSlug);
  },
  findModuleBody(idOrSlug: string): AcademyModuleDetail | undefined {
    const snap = read();
    if (snap.moduleBodies[idOrSlug]) return snap.moduleBodies[idOrSlug];
    const listed = snap.modules.find((mod) => mod.id === idOrSlug || mod.slug === idOrSlug);
    return listed ? snap.moduleBodies[listed.id] : undefined;
  },
};
