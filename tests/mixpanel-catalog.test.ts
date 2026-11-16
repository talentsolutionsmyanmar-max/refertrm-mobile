import assert from "node:assert/strict";
import test from "node:test";
import {
  boundedDistinctId,
  isMixpanelEventName,
  MIXPANEL_EVENTS,
  sanitizeMixpanelProperties,
} from "../src/analytics/catalog";

test("catalog includes web PR #1018 events plus app_opened", () => {
  for (const name of [
    "app_opened",
    "academy_course_viewed",
    "academy_lesson_started",
    "academy_lesson_completed",
    "academy_course_completed",
    "academy_search_used",
    "language_toggled",
    "signup_success",
    "login_success",
    "job_viewed",
    "job_applied",
  ]) {
    assert.equal(isMixpanelEventName(name), true, name);
  }
  assert.equal(isMixpanelEventName("game_started"), false);
  assert.equal(isMixpanelEventName("job_apply_clicked"), false);
  assert.ok(MIXPANEL_EVENTS.includes("app_opened"));
});

test("keeps allowlisted ids and drops emails, phones, names, and search text", () => {
  assert.deepEqual(
    sanitizeMixpanelProperties({
      course_id: "job-interview",
      module_id: "ji-1",
      xp_gained: 20,
      method: "email",
      email: "ada@example.com",
      phone: "+959123456789",
      name: "Ada Lovelace",
      query: "accountant yangon",
      code: "TRM-SECRET",
      job_title: "Accountant",
      title: "How salary works",
    }),
    {
      course_id: "job-interview",
      module_id: "ji-1",
      lesson_id: "ji-1",
      xp_earned: 20,
      method: "email",
    },
  );
});

test("normalizes language mm to my and rejects email-shaped strings", () => {
  assert.deepEqual(
    sanitizeMixpanelProperties({
      from_language: "mm",
      to_language: "en",
      surface: "academy_lesson",
      course_id: "user@example.com",
      app_version: "1.0.0",
      platform: "android",
    }),
    {
      from_language: "my",
      to_language: "en",
      surface: "academy_lesson",
      app_version: "1.0.0",
      platform: "android",
    },
  );
});

test("distinct_id rejects emails and phone-shaped values", () => {
  assert.equal(boundedDistinctId("ada@example.com"), null);
  assert.equal(boundedDistinctId("+959123456789"), null);
  assert.equal(boundedDistinctId("  "), null);
  const id = boundedDistinctId("install-abc-123");
  assert.equal(id, "install-abc-123");
});
