import assert from "node:assert/strict";
import test from "node:test";
import { parseDeepLink } from "../src/linking/paths.ts";
import { parseRouteSegment } from "../src/linking/ids.ts";

test("parses the four Phase 1 deep-link forms", () => {
  assert.deepEqual(parseDeepLink("refertrm://jobs/abc-123"), { type: "jobs", id: "abc-123" });
  assert.deepEqual(parseDeepLink("refertrm://learn/serve-with-dignity"), { type: "learn", slug: "serve-with-dignity" });
  assert.deepEqual(parseDeepLink("refertrm:///jobs/abc-123"), { type: "jobs", id: "abc-123" });
  assert.deepEqual(parseDeepLink("https://www.refertrm.com/jobs/abc-123"), { type: "jobs", id: "abc-123" });
  assert.deepEqual(parseDeepLink("https://www.refertrm.com/learn/serve-with-dignity"), { type: "learn", slug: "serve-with-dignity" });
});

test("invalid percent-encoding and separators fail closed", () => {
  assert.equal(parseDeepLink("refertrm://jobs/%E0%A4%A").type, "invalid");
  assert.equal(parseDeepLink("refertrm://learn/%E0%A4%A").type, "invalid");
  assert.equal(parseDeepLink("refertrm://jobs/..").type, "invalid");
  assert.equal(parseDeepLink("refertrm://learn/%2F").type, "invalid");
  assert.equal(parseDeepLink("https://www.refertrm.com/jobs/%E0%A4%A").type, "invalid");
  assert.equal(parseDeepLink("https://www.refertrm.com/learn/%2F").type, "invalid");
  assert.equal(parseRouteSegment("%E0%A4%A"), null);
  assert.equal(parseDeepLink("refertrm://apply/1").type, "invalid");
  assert.equal(parseDeepLink("https://www.refertrm.com/jobs/").type, "invalid");
});
