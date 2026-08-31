import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const statePath = join(root, "src/components/states/ModuleState.tsx");

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

test("module states cover loading empty error offline and auth-required with one truthful action", () => {
  assert.equal(existsSync(statePath), true);
  const state = readFileSync(statePath, "utf8");
  for (const kind of ["loading", "empty", "error", "offline", "auth-required"]) {
    assert.equal(state.includes(`\"${kind}\"`), true, `missing ${kind} state`);
  }
  assert.equal(state.includes("ActivityIndicator"), true);
  assert.equal(state.includes("minHeight: tap"), true);
  assert.equal(state.includes("actionLabel"), true);
});

test("Earn separates unavailable earned pending and paid values and browser-gates private referral data", () => {
  const earn = source("app/(tabs)/earn.tsx");
  for (const text of ["— MMK", "Shown after verification", "Earned", "Pending", "Paid", "How it works"]) {
    assert.equal(earn.includes(text), true, `Earn must show ${text}`);
  }
  assert.equal(earn.includes('"https://www.refertrm.com/eq/referrals"'), true);
  assert.equal(earn.includes("Linking.openURL"), true);
  assert.equal(/<Text[^>]*color:\s*"rgba\(/.test(earn), false, "Earn text must use opaque design tokens");
});

test("Me exposes identity tools plus honest local Saved and device settings", () => {
  const me = source("app/(tabs)/me.tsx");
  const copy = source("src/copy/en.ts");
  for (const text of ["Trinity", "CV & Profile", "Saved on this device", "Notifications", "Language", "Theme", "Data saver"]) {
    assert.equal(me.includes(text), true, `Me must show ${text}`);
  }
  assert.equal(me.includes("copy.account.title"), true);
  assert.equal(copy.includes('title: "Account & sign in"'), true);
  assert.equal(me.includes('"https://www.refertrm.com/eq/settings"'), true);
  assert.equal(me.includes("setDeviceSetting"), true);
});
