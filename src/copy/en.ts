/**
 * P1 English chrome. CCO authors every Myanmar string later (F50).
 * Job titles stay English. Server mmReady / contentMm is CCO data, not chrome.
 * Zero emoji. Formal register when MM lands.
 */
export const copy = {
  appName: "ReferTRM",
  tagline: "Myanmar career platform",

  nav: {
    home: "Home",
    jobs: "Jobs",
    learn: "Learn",
    academy: "Learn",
    earn: "Earn",
    me: "Me",
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
    descriptionEmpty: "No description listed.",
    requirementsOffline: "Requirements need a connection.",
    requirementsEmpty: "No requirements listed.",
    inactive: "This job is no longer listed as open.",
    requirements: "Requirements",
    aboutRole: "About this role",
    description: "Description",
    refresh: "Try again",
    fullTime: "Full time",
    partTime: "Part time",
    contract: "Contract",
    internship: "Internship",
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
    whatYouLearn: "What you will learn",
    keyTakeaway: "Key takeaway",
    commonMistake: "Common mistake",
    actionSteps: "Action steps",
    decisionScenario: "Decision scenario",
    vocabulary: "Key terms",
    quizTitle: "Practice quiz",
    quizProgress: (index: number, total: number) => `Question ${index} of ${total}`,
    quizCorrect: "Correct",
    quizNotQuite: "Not quite",
    quizNext: "Next question",
    quizSeeScore: "See score",
    quizRetake: "Retake quiz",
    quizComplete: "Quiz complete",
    quizScore: (correct: number, total: number) => `${correct} of ${total} correct`,
    optionLabel: (letter: string, text: string) => `Option ${letter}: ${text}`,
  },

  offline: {
    banner: "You are offline. Showing saved content.",
    stale: "Saved content. It may be out of date.",
  },

  ydc: {
    eyebrow: "YDC",
    title: "Youth Development Center",
    detail: "Grade path and practice on ReferTRM.com. Opens in your browser.",
  },

  errors: {
    generic: "Something went wrong. Try again.",
    notFound: "Not found.",
    network: "ReferTRM cannot connect on this network.",
    timeout: "ReferTRM is taking longer than expected.",
    transport: "ReferTRM cannot connect on this network.",
    loading: "Loading…",
    connecting: "Connecting…",
    retry: "Try again",
  },
} as const;

export type Copy = typeof copy;
