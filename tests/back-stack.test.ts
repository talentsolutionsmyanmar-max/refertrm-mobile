import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

test("detail fallbacks return to their owning tab roots", () => {
  const jobs = source("app/jobs/[id].tsx");
  const learn = source("app/learn/[slug].tsx");

  assert.equal(jobs.includes('<Link href="/jobs"'), true);
  assert.equal(learn.includes('<Link href="/learn"'), true);
  assert.equal(jobs.includes('<Link href="/"'), false);
  assert.equal(learn.includes('href="/academy"'), false);
});

test("cold root enters Home while detail routes remain above the tab navigator", () => {
  const rootLayout = source("app/_layout.tsx");

  assert.equal(existsSync(join(root, "app/index.tsx")), true);
  const rootEntry = source("app/index.tsx");
  assert.equal(rootEntry.includes('<Redirect href="/home"'), true);
  assert.equal(rootLayout.includes('<Stack.Screen name="(tabs)"'), true);
  assert.equal(rootLayout.includes('<Stack.Screen name="jobs/[id]"'), true);
  assert.equal(rootLayout.includes('<Stack.Screen name="learn/[slug]"'), true);
  assert.equal(rootLayout.includes("BackHandler"), false);
});
