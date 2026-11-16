import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

test("root layout initializes Mixpanel and records app_opened on launch and resume", () => {
  const src = read("app/_layout.tsx");
  assert.ok(src.includes("initProductAnalytics"));
  assert.ok(src.includes("captureProductEvent"));
  assert.ok(src.includes('"app_opened"'));
  assert.ok(src.includes("Platform.OS"));
  assert.ok(src.includes("Constants.expoConfig?.version"));
});

test("native academy, jobs, and language surfaces fire matching web event names", () => {
  const lesson = read("app/learn/[slug].tsx");
  assert.ok(lesson.includes('captureProductEvent("academy_lesson_started"'));
  assert.ok(lesson.includes('captureProductEvent("language_toggled"'));
  assert.ok(lesson.includes('surface: "academy_lesson"'));
  assert.equal(lesson.includes("titleEn"), true);
  assert.equal(lesson.includes("email"), false);

  const learn = read("app/(tabs)/learn.tsx");
  assert.ok(learn.includes("trackAcademySearchUsed"));
  assert.ok(learn.includes("SEARCH_DEBOUNCE_MS"));
  assert.ok(learn.includes('"learn_catalog"'));

  const job = read("app/jobs/[id].tsx");
  assert.ok(job.includes('captureProductEvent("job_viewed"'));
  assert.ok(job.includes("job_id: jobId"));
  assert.equal(job.includes("job.title"), true);
  const jobCapture = job.match(/captureProductEvent\("job_viewed", \{[\s\S]*?\}\);/);
  assert.ok(jobCapture);
  assert.equal(jobCapture[0].includes("title"), false);
  assert.equal(jobCapture[0].includes("company?.name"), false);

  const me = read("app/(tabs)/me.tsx");
  assert.ok(me.includes('captureProductEvent("language_toggled"'));
  assert.ok(me.includes('surface: "device"'));
});

test("P1 has no native auth or apply success path, so those Mixpanel events are not wired", () => {
  const session = read("src/auth/session.ts");
  assert.ok(session.includes("return null"));
  assert.equal(session.includes("captureProductEvent"), false);

  for (const file of [
    "app/(tabs)/home.tsx",
    "app/(tabs)/me.tsx",
    "app/(tabs)/earn.tsx",
    "app/jobs/[id].tsx",
    "src/auth/session.ts",
  ]) {
    const src = read(file);
    assert.equal(src.includes("login_success"), false, file);
    assert.equal(src.includes("signup_success"), false, file);
    assert.equal(src.includes("job_applied"), false, file);
  }
});

test("analytics reads EXPO_PUBLIC_MIXPANEL_TOKEN and never hardcodes a project token", () => {
  const token = read("src/analytics/token.ts");
  assert.ok(token.includes('MIXPANEL_TOKEN_ENV = "EXPO_PUBLIC_MIXPANEL_TOKEN"'));
  assert.ok(token.includes("process.env.EXPO_PUBLIC_MIXPANEL_TOKEN"));
  const example = read(".env.example");
  assert.ok(example.includes("EXPO_PUBLIC_MIXPANEL_TOKEN"));
  assert.equal(/EXPO_PUBLIC_MIXPANEL_TOKEN=\S+/.test(example), false);
});
