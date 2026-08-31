import assert from "node:assert/strict";
import test from "node:test";
import {
  ACCESS_TOKEN_KEY,
  clearAccessToken,
  configureSecureSessionStorage,
  getAccessToken,
  saveAccessToken,
  type SecureSessionStorage,
} from "../src/auth/session.ts";

function memoryStore(): SecureSessionStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItemAsync: async (key) => values.get(key) ?? null,
    setItemAsync: async (key, value) => {
      values.set(key, value);
    },
    deleteItemAsync: async (key) => {
      values.delete(key);
    },
  };
}

test("access token is stored only through the configured secure session store", async () => {
  const store = memoryStore();
  configureSecureSessionStorage(store);

  await saveAccessToken("mobile-access-token");

  assert.equal(store.values.get(ACCESS_TOKEN_KEY), "mobile-access-token");
  assert.equal(await getAccessToken(), "mobile-access-token");
});

test("blank or whitespace-bearing access tokens fail closed", async () => {
  configureSecureSessionStorage(memoryStore());

  await assert.rejects(saveAccessToken("   "), /invalid_access_token/);
  await assert.rejects(saveAccessToken("token with spaces"), /invalid_access_token/);
  await assert.rejects(saveAccessToken(" token"), /invalid_access_token/);
  await assert.rejects(saveAccessToken("token "), /invalid_access_token/);
});

test("stored tokens with leading or trailing whitespace are rejected and deleted", async () => {
  for (const malformed of [" token", "token ", "\ttoken", "token\n"]) {
    const store = memoryStore();
    store.values.set(ACCESS_TOKEN_KEY, malformed);
    configureSecureSessionStorage(store);

    assert.equal(await getAccessToken(), null);
    assert.equal(store.values.has(ACCESS_TOKEN_KEY), false);
  }
});

test("stored oversized tokens are rejected and deleted at the boundary", async () => {
  const validStore = memoryStore();
  validStore.values.set(ACCESS_TOKEN_KEY, "x".repeat(16_384));
  configureSecureSessionStorage(validStore);
  assert.equal((await getAccessToken())?.length, 16_384);

  const oversizedStore = memoryStore();
  oversizedStore.values.set(ACCESS_TOKEN_KEY, "x".repeat(16_385));
  configureSecureSessionStorage(oversizedStore);
  assert.equal(await getAccessToken(), null);
  assert.equal(oversizedStore.values.has(ACCESS_TOKEN_KEY), false);
});

test("clear removes the native session token", async () => {
  const store = memoryStore();
  configureSecureSessionStorage(store);
  await saveAccessToken("mobile-access-token");

  await clearAccessToken();

  assert.equal(await getAccessToken(), null);
  assert.equal(store.values.has(ACCESS_TOKEN_KEY), false);
});
