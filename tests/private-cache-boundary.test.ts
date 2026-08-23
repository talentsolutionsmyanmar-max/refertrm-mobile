import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const privatePath = join(root, "src/storage/private.ts");

test("private cache requires an encrypted adapter and never uses public MMKV", async () => {
  assert.equal(existsSync(privatePath), true);
  const source = readFileSync(privatePath, "utf8");
  assert.equal(source.includes("MMKV"), false);

  const { createPrivateCache } = await import("../src/storage/private.ts");
  assert.throws(
    () => createPrivateCache({ security: "plain", getString: () => undefined, set: () => undefined, delete: () => undefined } as never),
    /encrypted/i,
  );
});

test("private cache refuses credential-shaped data and clears every private domain", async () => {
  assert.equal(existsSync(privatePath), true);
  const { createPrivateCache, PRIVATE_CACHE_DOMAINS } = await import("../src/storage/private.ts");
  const values = new Map<string, string>();
  const deleted: string[] = [];
  const cache = createPrivateCache({
    security: "encrypted",
    getString: (key: string) => values.get(key),
    set: (key: string, value: string) => values.set(key, value),
    delete: (key: string) => {
      deleted.push(key);
      values.delete(key);
    },
  });

  assert.throws(() => cache.write("home-summary", { accessToken: "not-allowed" }), /credential/i);
  cache.write("home-summary", { state: "auth-required", updatedAt: "2026-08-23T00:00:00Z" });
  assert.deepEqual(cache.read("home-summary"), { state: "auth-required", updatedAt: "2026-08-23T00:00:00Z" });
  cache.clearAll();
  assert.equal(deleted.length, PRIVATE_CACHE_DOMAINS.length);
});

test("cache schemas keep public and private versions explicit", () => {
  const schemaPath = join(root, "src/cache/schema.ts");
  assert.equal(existsSync(schemaPath), true);
  const source = readFileSync(schemaPath, "utf8");
  assert.equal(source.includes("PUBLIC_CACHE_SCHEMA_VERSION"), true);
  assert.equal(source.includes("PRIVATE_CACHE_SCHEMA_VERSION"), true);
});
