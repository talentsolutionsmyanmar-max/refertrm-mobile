export const PUBLIC_CACHE_SCHEMA_VERSION = 1;
export const PRIVATE_CACHE_SCHEMA_VERSION = 1;

export const PUBLIC_CACHE_LIMITS = {
  jobBodies: 25,
  lessonBodies: 15,
  savedIds: 100,
} as const;

export const PRIVATE_CACHE_LIMITS = {
  notifications: 50,
} as const;
