import assert from "node:assert/strict";
import test from "node:test";
import { isInternalHttps, safeHttpsUrl } from "../src/api/https.ts";

test("allows https destinations and rejects other schemes", () => {
  assert.ok(safeHttpsUrl("https://www.refertrm.com/learn/serve"));
  assert.equal(safeHttpsUrl("http://www.refertrm.com/jobs/1"), null);
  assert.equal(safeHttpsUrl("javascript:alert(1)"), null);
  assert.equal(safeHttpsUrl("file:///etc/passwd"), null);
  assert.equal(safeHttpsUrl("https://user:pass@evil.com"), null);
  assert.equal(isInternalHttps("https://www.refertrm.com/jobs/1"), true);
  assert.equal(isInternalHttps("https://example.com"), false);
});
