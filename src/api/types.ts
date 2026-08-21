/** Shapes of live ReferTRM JSON. Dual-table: public jobs are Pascal `Job` via /api/jobs. Never query snake `jobs`. */

export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

export type JobCompany = {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
  industry: string | null;
  location: string | null;
  overallRating: number | null;
  tenantEnvironment: string | null;
};

export type Job = {
  id: string;
  title: string;
  titleMm: string | null;
  slug: string;
  companyId: string;
  description: string | null;
  descriptionMm: string | null;
  requirements: string | null;
  location: string | null;
  locationMm: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryDisplay: string | null;
  reward: number | null;
  successFee: number | null;
  type: string | null;
  level: string | null;
  skills: string | null;
  status: string;
  urgent: boolean;
  featured: boolean;
  views: number | null;
  createdAt: string;
  updatedAt: string | null;
  expiresAt: string | null;
  recruiterBrief: string | null;
  recruiterBriefAt: string | null;
  headcount: number | null;
  shareCount: number | null;
  screeningQuestions: Json | null;
  postedAt: string | null;
  company: JobCompany | null;
  _count: { applications: number } | null;
};

/** List-cache projection. Drop description bodies so the list stays small. */
export type JobListItem = Pick<
  Job,
  | "id"
  | "title"
  | "slug"
  | "companyId"
  | "location"
  | "salaryDisplay"
  | "salaryMin"
  | "salaryMax"
  | "type"
  | "level"
  | "skills"
  | "urgent"
  | "featured"
  | "postedAt"
  | "createdAt"
  | "status"
  | "company"
  | "_count"
>;

export type JobsResponse = { jobs: Job[] };

export type AcademyModuleListItem = {
  id: string;
  titleEn: string;
  titleMm: string | null;
  category: string;
  durationMinutes: number | null;
  xpReward: number | null;
  level: string | null;
  order: number | null;
  slug: string;
  ksaFamily: string | null;
  ksaLevel: string | null;
  mmReady: boolean;
  quizCount: number;
};

export type AcademyPublicResponse = {
  success: boolean;
  modules: AcademyModuleListItem[];
  count: number;
};

export type AcademyModuleDetail = AcademyModuleListItem & {
  content: Json | null;
  contentMm: Json | null;
  /** Detail payload name. Catalogue uses `mmReady`. Map both; do not assume they match. */
  mmContentReady?: boolean;
  hookTextMm: string | null;
  keyTakeawayMm: string | null;
  commonMistakeMm: string | null;
  actionStepsMm: string | null;
  decisionScenarioMm: string | null;
  isPublished: boolean;
  difficultyLevel: string | null;
  quizQuestions?: Json | null;
  quizQuestionsMm?: Json | null;
  learningObjectives?: Json | null;
  furtherReadingUrl?: string | null;
  furtherReadingLabel?: string | null;
};

export type AcademyModuleResponse = {
  success: boolean;
  module: AcademyModuleDetail;
};

/** Auth uid is UUID. public.User.id is TEXT. Use APIs; do not join in the app. */
export type AuthUser = {
  id: string;
  email: string | null;
};
