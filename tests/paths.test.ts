import assert from "node:assert/strict";
import test from "node:test";
import { parseDeepLink } from "../src/linking/paths.ts";

test("parses the four Phase 1 deep-link forms", () => {
  assert.deepEqual(parseDeepLink("refertrm://jobs/abc-123"), { type: "jobs", id: "abc-123" });
  assert.deepEqual(parseDeepLink("refertrm://learn/serve-with-dignity"), { type: "learn", slug: "serve-with-dignity" });
  assert.deepEqual(parseDeepLink("refertrm:///jobs/abc-123"), { type: "jobs", id: "abc-123" });
  assert.deepEqual(parseDeepLink("https://www.refertrm.com/jobs/abc-123"), { type: "jobs", id: "abc-123" });
  assert.deepEqual(parseDeepLink("https://www.refertrm.com/learn/serve-with-dignity"), { type: "learn", slug: "serve-with-dignity" });
});

test("invalid paths fail closed", () => {
  assert.equal(parseDeepLink("refertrm://apply/1").type, "invalid");
  assert.equal(parseDeepLink("refertrm://profile").type, "invalid");
  assert.equal(parseDeepLink("https://evil.com/jobs/1").type, "invalid");
  assert.equal(parseDeepLink("https://www.refertrm.com/jobs/").type, "invalid");
  assert.equal(parseDeepLink("https://www.refertrm.com/jobs/../etc").type, "invalid");
});
