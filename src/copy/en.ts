/**
 * P1 English chrome. CCO authors every Myanmar string later (F50).
 * Job titles stay English. Server mmReady / contentMm is CCO data, not chrome.
 * Zero emoji. Formal register when MM lands.
 */
export const copy = {
  appName: "ReferTRM",
  tagline: "Myanmar career platform",

  nav: {
    jobs: "Jobs",
    academy: "Academy",
  },

  start: {
    title: "Start",
    subtitle: "Choose a path",
    startHere: "Start here",
    jobs: "Jobs",
    academy: "Academy",
    careerGame: "Career Game",
    overflow: "Full Start on the web",
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
    inactive: "This job is no longer listed as open.",
    requirements: "Requirements",
    refresh: "Refresh",
    fullTime: "Full time",
    partTime: "Part time",
    contract: "Contract",
    internship: "Internship",
  },

  academy: {
    title: "Academy",
    empty: "No published courses.",
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
    mmHidden:
      "Myanmar for this lesson is not approved yet. English is shown instead.",
  },

  offline: {
    banner: "You are offline. Showing saved content.",
  },

  errors: {
    generic: "Something went wrong. Try again.",
    notFound: "Not found.",
    network: "Cannot reach ReferTRM. Check your connection.",
    loading: "Loading…",
  },
} as const;

export type Copy = typeof copy;
