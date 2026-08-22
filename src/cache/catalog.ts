import { getKv } from "../storage/kv";
import { toListItem, usefulJobBody } from "../api/project";
import type { AcademyModuleDetail, AcademyModuleListItem, Job, JobListItem } from "../api/types";

export const CATALOG_KEY = "refertrm.p1.catalog.v1";
export const MAX_JOB_BODIES = 25;
export const MAX_MODULE_BODIES = 15;

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

function migrateJobs(
  rawJobs: unknown[],
  jobBodies: Record<string, JobBody>,
  jobBodyOrder: string[],
): { jobs: JobListItem[]; jobBodies: Record<string, JobBody>; jobBodyOrder: string[] } {
  let bodies = { ...jobBodies };
  let order = [...jobBodyOrder];
  const jobs: JobListItem[] = [];
  for (const row of rawJobs) {
    if (!row || typeof row !== "object") continue;
    const rec = row as JobListItem & { description?: string | null; requirements?: string | null };
    if (!rec.id || !rec.title || !rec.slug) continue;
    const legacy = usefulJobBody(rec);
    if (legacy && !bodies[rec.id]) {
      const stored = lruSet(bodies, order, rec.id, legacy, MAX_JOB_BODIES);
      bodies = stored.map;
      order = stored.order;
    }
    jobs.push(toListItem(rec));
  }
  return { jobs, jobBodies: bodies, jobBodyOrder: order };
}

function read(): CatalogSnapshot {
  const raw = getKv().getString(CATALOG_KEY);
  if (!raw) return empty();
  try {
    const parsed = JSON.parse(raw) as CatalogSnapshot;
    const migrated = migrateJobs(
      Array.isArray(parsed.jobs) ? parsed.jobs : [],
      parsed.jobBodies ?? {},
      parsed.jobBodyOrder ?? [],
    );
    return {
      ...empty(),
      ...parsed,
      jobs: migrated.jobs,
      jobBodies: migrated.jobBodies,
      jobBodyOrder: migrated.jobBodyOrder,
      modules: Array.isArray(parsed.modules) ? parsed.modules : [],
      moduleBodies: parsed.moduleBodies ?? {},
      moduleBodyOrder: parsed.moduleBodyOrder ?? [],
    };
  } catch {
    return empty();
  }
}

function write(next: CatalogSnapshot): CatalogSnapshot {
  getKv().set(CATALOG_KEY, JSON.stringify(next));
  return next;
}

export const catalog = {
  snapshot: read,
  writeJobs(jobs: Array<Job | JobListItem>): CatalogSnapshot {
    const current = read();
    let bodies = current.jobBodies;
    let order = current.jobBodyOrder;
    const list = jobs.map((job) => {
      const legacy = usefulJobBody(job);
      if (legacy && !bodies[job.id]) {
        const stored = lruSet(bodies, order, job.id, legacy, MAX_JOB_BODIES);
        bodies = stored.map;
        order = stored.order;
      }
      return toListItem(job);
    });
    return write({
      ...current,
      jobs: list,
      jobBodies: bodies,
      jobBodyOrder: order,
      jobsSyncedAt: Date.now(),
    });
  },
  writeJobBody(job: Pick<Job, "id" | "description" | "requirements">): CatalogSnapshot {
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
    const direct = Object.prototype.hasOwnProperty.call(snap.jobBodies, id) ? id : undefined;
    const meta = direct ? undefined : snap.jobs.find((job) => job.id === id || job.slug === id);
    const key = direct ?? (meta && Object.prototype.hasOwnProperty.call(snap.jobBodies, meta.id) ? meta.id : undefined);
    if (!key) return undefined;
    const body = snap.jobBodies[key];
    if (!body) return undefined;
    if (snap.jobBodyOrder[snap.jobBodyOrder.length - 1] !== key) {
      const stored = lruSet(snap.jobBodies, snap.jobBodyOrder, key, body, MAX_JOB_BODIES);
      write({
        ...snap,
        jobBodies: stored.map,
        jobBodyOrder: stored.order,
      });
    }
    return body;
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
