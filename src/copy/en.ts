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
    home: "Home",
    jobs: "Jobs",
    learn: "Learn",
    academy: "Learn",
    earn: "Earn",
    me: "Me",
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
    referralReward: (amount: string) => `Estimated referral reward: ${amount}`,
    applyOnline: "Continue on ReferTRM.com",
    applyNative: "Apply for this role",
    applySubmitted: "Application submitted",
    applySubmittedDetail: "ReferTRM received this application. You can review its status from Me.",
    signInToApply: "Sign in to apply",
    applySessionUnavailable:
      "A secure mobile session is not available. Open ReferTRM to continue in your browser.",
    applyConflict: "This role is inactive or an application already exists.",
    applyRateLimited: "Too many application attempts. Try again after the server limit resets.",
    applyFailed: "The application was not submitted. Check your connection and try again.",
    referOrShare: "Refer or share",
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

  account: {
    title: "Account & sign in",
    accountUnavailable:
      "A secure mobile session is not available. Open ReferTRM to continue in your browser.",
    openStart: "Open ReferTRM Start",
    openSettings: "Open account settings",
    loading: "Checking your ReferTRM account",
    loadingDetail: "Private account details are requested only with a secure mobile session.",
    error: "Account details are unavailable",
    errorDetail: "ReferTRM could not verify private account details. No account data is shown.",
    applications: (n: number) => `${n} application${n === 1 ? "" : "s"}`,
    signedIn: "Verified account",
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
