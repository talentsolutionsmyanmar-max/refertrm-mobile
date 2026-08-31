import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("Expo SecureStore is the production adapter for the native access token", () => {
  const layout = readFileSync(join(root, "app/_layout.tsx"), "utf8");
  const app = JSON.parse(readFileSync(join(root, "app.json"), "utf8"));
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

  assert.equal(layout.includes('from "expo-secure-store"'), true);
  assert.equal(layout.includes("configureSecureSessionStorage"), true);
  assert.equal(app.expo.plugins.includes("expo-secure-store"), true);
  assert.equal(typeof pkg.dependencies["expo-secure-store"], "string");
});

test("private Bearer integration is explicit while public Jobs and Learn remain credential-free", () => {
  const client = readFileSync(join(root, "src/api/client.ts"), "utf8");
  const account = readFileSync(join(root, "src/api/account.ts"), "utf8");

  assert.equal(client.includes("Authorization"), false);
  assert.equal(account.includes('headers.set("Authorization", `Bearer ${accessToken}`)'), true);
  assert.equal(account.includes("laterEndpoints.me"), true);
  assert.equal(account.includes("laterEndpoints.apply"), true);
});
