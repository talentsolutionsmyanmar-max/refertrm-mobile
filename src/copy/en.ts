/**
 * P1 English chrome. CCO authors every Myanmar string later (F50).
 * Job titles stay English. Server mmReady / contentMm is CCO data, not chrome.
 * Zero emoji. Formal register when MM lands.
 */
import { isTimeoutError, isTransportError } from "../api/signal";

export const copy = {
  appName: "ReferTRM",
  tagline: "Myanmar career platform",

  nav: {
    jobs: "Jobs",
    academy: "Academy",
  },

  jobs: {
    title: "Jobs",
    search: "Search jobs",
    filterAll: "All",
    yangon: "Yangon",
    mandalay: "Mandalay",
    remote: "Remote",
    urgent: "Urgent",
    empty: "No jobs match your search.",
    emptyOffline: "No saved jobs yet. Connect once to download the list.",
    count: (n: number) => `${n} open roles`,
    locationUnknown: "Location not listed",
    salaryHidden: "Salary not listed",
    descriptionOffline: "Job description needs a connection.",
    descriptionEmpty: "No description listed.",
    requirementsOffline: "Requirements need a connection.",
    requirementsEmpty: "No requirements listed.",
    inactive: "This job is no longer listed as open.",
    requirements: "Requirements",
    refresh: "Try again",
    fullTime: "Full time",
    partTime: "Part time",
    contract: "Contract",
    internship: "Internship",
    applyUnavailable:
      "Applications are not available in this version. Use www.refertrm.com after sign-in.",
  },

  academy: {
    title: "Academy",
    empty: "No published courses match your search.",
    emptyOffline: "No saved courses yet. Connect once to download the catalogue.",
    minutes: (n: number) => `${n} min`,
    xp: (n: number) => `${n} XP`,
    count: (n: number) => `${n} published courses`,
    search: "Search courses",
    bodyOffline: "This lesson needs a connection the first time.",
    languageEn: "English",
    languageMm: "Myanmar",
    myanmarAvailable: "Myanmar available",
    allTopics: "All topics",
    questions: "Questions",
    mmHidden: "Myanmar for this lesson is not approved yet. English is shown instead.",
    furtherReading: "Further reading",
  },

  offline: {
    banner: "You are offline. Showing saved content.",
    stale: "Saved content. It may be out of date.",
  },

  errors: {
    generic: "Something went wrong. Try again.",
    notFound: "Not found.",
    network: "ReferTRM cannot connect on this network.",
    timeout: "ReferTRM is taking longer than expected.",
    transport: "ReferTRM cannot connect on this network.",
    loading: "Loading…",
    retry: "Try again",
  },
} as const;

export function errorMessage(error: unknown): string {
  if (isTimeoutError(error)) return copy.errors.timeout;
  if (isTransportError(error)) return copy.errors.transport;
  return copy.errors.generic;
}

export type Copy = typeof copy;
