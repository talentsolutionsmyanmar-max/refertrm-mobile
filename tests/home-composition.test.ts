import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const home = readFileSync(join(root, "app/(tabs)/home.tsx"), "utf8");

const requiredCapabilities = [
  "Career Game",
  "Maya",
  "Trinity",
  "Featured jobs",
  "Explore Learn",
  "Earn",
  "CV & Profile",
  "Saved",
  "Notifications",
  "Settings",
];

test("public Home visibly represents the whole product without fabricated personalization", () => {
  for (const capability of requiredCapabilities) {
    assert.equal(home.includes(capability), true, `Home must represent ${capability}`);
  }
  assert.equal(home.includes("Recommended for you"), false);
  assert.equal(home.includes("— MMK"), true);
  assert.equal(home.includes("Shown after verification"), true);
});

test("Career Game and Maya are the first dominant Home actions with approved HTTPS handoffs", () => {
  const game = home.indexOf("Continue Career Game");
  const maya = home.indexOf("Ask Maya");
  const trinity = home.indexOf("Trinity");

  assert.ok(game >= 0 && maya >= 0 && trinity >= 0);
  assert.ok(game < trinity && maya < trinity);
  assert.equal(home.includes('"https://www.refertrm.com/eq/game"'), true);
  assert.equal(home.includes('"https://www.refertrm.com/eq/maya"'), true);
  assert.equal(home.includes("Linking.openURL"), true);
});

test("Home modules isolate state instead of relying on one full-screen request", () => {
  assert.equal(home.includes("HomeModule"), true);
  assert.equal(home.includes("useQuery"), false);
  assert.equal(home.includes("/api/mobile/home"), false);
});
