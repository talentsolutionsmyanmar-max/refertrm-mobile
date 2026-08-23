import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDeepLink } from "../src/linking/paths.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("approved custom-scheme tab roots map only to the five shell destinations", () => {
  assert.deepEqual(parseDeepLink("refertrm://home"), { type: "tab", tab: "home" });
  assert.deepEqual(parseDeepLink("refertrm://jobs"), { type: "tab", tab: "jobs" });
  assert.deepEqual(parseDeepLink("refertrm://learn"), { type: "tab", tab: "learn" });
  assert.deepEqual(parseDeepLink("refertrm://earn"), { type: "tab", tab: "earn" });
  assert.deepEqual(parseDeepLink("refertrm://me"), { type: "tab", tab: "me" });
});

test("expanded links preserve public details and fail closed for gated or arbitrary routes", () => {
  assert.deepEqual(parseDeepLink("refertrm://jobs/abc-123"), { type: "jobs", id: "abc-123" });
  assert.deepEqual(parseDeepLink("refertrm://learn/lesson-one"), { type: "learn", slug: "lesson-one" });
  assert.equal(parseDeepLink("refertrm://game").type, "invalid");
  assert.equal(parseDeepLink("refertrm://auth/login").type, "invalid");
  assert.equal(parseDeepLink("https://evil.example/home").type, "invalid");
});

test("Android registers custom-scheme shell roots without claiming gated HTTPS routes", () => {
  const app = JSON.parse(readFileSync(join(root, "app.json"), "utf8"));
  const data = app.expo.android.intentFilters.flatMap((filter: { data: Record<string, string>[] }) => filter.data);
  const customHosts = data.filter((entry: Record<string, string>) => entry.scheme === "refertrm").map((entry: Record<string, string>) => entry.host);

  assert.deepEqual(customHosts, ["home", "jobs", "learn", "earn", "me"]);
  assert.equal(data.some((entry: Record<string, string>) => entry.scheme === "https" && entry.pathPrefix === "/eq"), false);
});
