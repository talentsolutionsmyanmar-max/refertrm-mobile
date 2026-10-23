import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { webLessonUrl } from "../src/linking/lessonWeb";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Website help articles from 25referTRM #950 are not Academy lessons.
assert.equal(
  webLessonUrl("how-to-spot-a-fake-job-offer-in-myanmar"),
  "https://www.refertrm.com/learn/how-to-spot-a-fake-job-offer-in-myanmar",
);
assert.equal(
  webLessonUrl("do-job-seekers-pay-fees-on-refertrm"),
  "https://www.refertrm.com/learn/do-job-seekers-pay-fees-on-refertrm",
);
assert.equal(webLessonUrl(["cv-writing"]), "https://www.refertrm.com/learn/cv-writing");

// Unsafe or empty slugs never produce a URL.
for (const bad of [undefined, null, "", "..", "a/b", "a%2Fb", "%2e%2e", "x?y=1", "x#y", "@evil", "-start"]) {
  assert.equal(webLessonUrl(bad as string | undefined | null), null, `rejects ${String(bad)}`);
}

// Every URL stays on www.refertrm.com/learn/.
const u = new URL(webLessonUrl("abc")!);
assert.equal(u.hostname, "www.refertrm.com");
assert.ok(u.pathname.startsWith("/learn/"));

// Lesson screen uses the fallback and never auto-opens the browser.
const screen = fs.readFileSync(path.join(root, "app/learn/[slug].tsx"), "utf8");
assert.ok(screen.includes("webLessonUrl(slug)"), "lesson screen computes website fallback");
assert.ok(screen.includes("onPress={() => void openWeb(webUrl)"), "browser opens only on tap");
assert.equal(/useEffect\([^)]*openWeb/s.test(screen), false, "must not auto-open");

console.log("learn-web-fallback PASS");
