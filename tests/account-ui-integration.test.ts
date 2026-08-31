import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

test("Me consumes Bearer profile and application reads with honest fallback to the start gateway", () => {
  const me = source("app/(tabs)/me.tsx");

  assert.equal(me.includes("fetchMe"), true);
  assert.equal(me.includes("fetchApplications"), true);
  assert.equal(me.includes("START_URL"), true);
  assert.equal(me.includes("ModuleState"), true);
  assert.equal(me.includes("—"), true, "private values must retain an unavailable state");
});

test("job detail submits through the existing Apply API and preserves browser fallback", () => {
  const job = source("app/jobs/[id].tsx");

  assert.equal(job.includes("submitApplication"), true);
  assert.equal(job.includes("START_URL"), true);
  assert.equal(job.includes("Linking.openURL(applyUrl)"), true);
  assert.equal(job.includes("copy.jobs.applyNative"), true);
  assert.equal(job.includes("copy.jobs.applyOnline"), true);
});

test("new account and Apply copy remains centralized", () => {
  const copy = source("src/copy/en.ts");
  const me = source("app/(tabs)/me.tsx");
  const job = source("app/jobs/[id].tsx");

  for (const key of ["applyNative", "applySubmitted", "signInToApply", "openStart", "accountUnavailable"]) {
    assert.equal(copy.includes(`${key}:`), true, `copy must define ${key}`);
  }
  assert.equal(me.includes('title="Sign in to apply"'), false);
  assert.equal(job.includes('title="Sign in to apply"'), false);
});
