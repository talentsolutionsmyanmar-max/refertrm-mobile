import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tabs = ["home", "jobs", "learn", "earn", "me"] as const;

test("tab navigator renders exactly Home Jobs Learn Earn Me in order", () => {
  const layout = readFileSync(join(root, "app/(tabs)/_layout.tsx"), "utf8");
  const configured = [...layout.matchAll(/<Tabs\.Screen\s+name="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(configured, tabs);
  for (const tab of tabs) {
    assert.equal(existsSync(join(root, `app/(tabs)/${tab}.tsx`)), true, `${tab} screen must exist`);
  }
});

test("tab navigator uses meaningful accessible icons instead of text letters", () => {
  const layout = readFileSync(join(root, "app/(tabs)/_layout.tsx"), "utf8");

  assert.equal(layout.includes("Ionicons"), true);
  assert.equal(layout.includes("<Text"), false);
  assert.equal(layout.includes("tabBarAccessibilityLabel"), true);
});
