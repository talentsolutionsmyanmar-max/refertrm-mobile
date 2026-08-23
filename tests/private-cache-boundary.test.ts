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

test("private cache rejects credential keys and authentication headers without writing", async () => {
  const { createPrivateCache } = await import("../src/storage/private.ts");
  const encryptedWrites: Array<[string, string]> = [];
  const cache = createPrivateCache({
    security: "encrypted",
    getString: () => undefined,
    set: (key: string, value: string) => encryptedWrites.push([key, value]),
    delete: () => undefined,
  });
  const rejectedPayloads: unknown[] = [
    { cookie: "session-cookie" },
    { wrapper: { cookie: "session-cookie" } },
    { session: { user: { id: "u1" } } },
    "Bearer synthetic-token",
    { header: "Bearer synthetic-token" },
    ["Bearer synthetic-token"],
    { AUTHORIZATION: "synthetic-value" },
    { "Set_Cookie": "synthetic-value" },
    { "access-token": "synthetic-value" },
    { "refresh.token": "synthetic-value" },
    { "ID TOKEN": "synthetic-value" },
    { TOKEN: "synthetic-value" },
    { Password: "synthetic-value" },
    { SECRET: "synthetic-value" },
    { "api-key": "synthetic-value" },
    { credential: "synthetic-value" },
    { "auth-token": "synthetic-value" },
    "Authorization: Bearer synthetic-token",
  ];

  for (const payload of rejectedPayloads) {
    assert.throws(() => cache.write("home-summary", payload), /credential/i);
  }
  assert.equal(encryptedWrites.length, 0);
});

test("private cache fails closed on cyclic and unsupported payloads without writing", async () => {
  const { createPrivateCache } = await import("../src/storage/private.ts");
  let encryptedWrites = 0;
  const cache = createPrivateCache({
    security: "encrypted",
    getString: () => undefined,
    set: () => {
      encryptedWrites += 1;
    },
    delete: () => undefined,
  });
  const cyclic: { self?: unknown } = {};
  cyclic.self = cyclic;

  assert.throws(() => cache.write("home-summary", cyclic), /credential/i);
  assert.throws(() => cache.write("home-summary", new Map([["cookie", "session-cookie"]])), /credential/i);
  assert.equal(encryptedWrites, 0);
});

test("private cache fails closed when payload traversal exceeds its bound", async () => {
  const { createPrivateCache } = await import("../src/storage/private.ts");
  let encryptedWrites = 0;
  const cache = createPrivateCache({
    security: "encrypted",
    getString: () => undefined,
    set: () => {
      encryptedWrites += 1;
    },
    delete: () => undefined,
  });
  const payload: { child?: unknown } = {};
  let cursor = payload;
  for (let depth = 0; depth < 65; depth += 1) {
    const child: { child?: unknown } = {};
    cursor.child = child;
    cursor = child;
  }

  assert.throws(() => cache.write("home-summary", payload), /credential/i);
  assert.equal(encryptedWrites, 0);
});

test("private cache fails closed when payload breadth exceeds its node bound", async () => {
  const { createPrivateCache } = await import("../src/storage/private.ts");
  let encryptedWrites = 0;
  const cache = createPrivateCache({
    security: "encrypted",
    getString: () => undefined,
    set: () => {
      encryptedWrites += 1;
    },
    delete: () => undefined,
  });
  const payload = Array.from({ length: 10_000 }, (_, index) => ({ value: index }));

  assert.throws(() => cache.write("home-summary", payload), /credential/i);
  assert.equal(encryptedWrites, 0);
});

test("private cache accepts benign nested data and ordinary bearer prose", async () => {
  const { createPrivateCache } = await import("../src/storage/private.ts");
  const values = new Map<string, string>();
  const cache = createPrivateCache({
    security: "encrypted",
    getString: (key: string) => values.get(key),
    set: (key: string, value: string) => values.set(key, value),
    delete: (key: string) => values.delete(key),
  });
  const payload = {
    state: "auth-required",
    content: [
      { title: "The bearer carried the message safely." },
      { title: "A bond may be payable to bearer under ordinary prose." },
    ],
  };

  cache.write("home-summary", payload);
  assert.deepEqual(cache.read("home-summary"), payload);
});

test("cache schemas keep public and private versions explicit", () => {
  const schemaPath = join(root, "src/cache/schema.ts");
  assert.equal(existsSync(schemaPath), true);
  const source = readFileSync(schemaPath, "utf8");
  assert.equal(source.includes("PUBLIC_CACHE_SCHEMA_VERSION"), true);
  assert.equal(source.includes("PRIVATE_CACHE_SCHEMA_VERSION"), true);
});
