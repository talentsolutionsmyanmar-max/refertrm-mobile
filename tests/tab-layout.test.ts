import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const layout = readFileSync(join(root, "app/(tabs)/_layout.tsx"), "utf8");
const tabs = ["home", "jobs", "learn", "earn", "me"] as const;

test("tab shell keeps Home Jobs Learn Earn Me in order with scaling enabled", () => {
  const configured = [...layout.matchAll(/<Tabs\.Screen\s+name="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(configured, [...tabs]);
  assert.equal(layout.includes("allowFontScaling"), false);
  assert.equal(layout.includes("tabBarShowLabel"), false);
  assert.equal(layout.includes("tabBarAllowFontScaling"), false);
  assert.equal(layout.includes("numberOfLines"), false);
  assert.equal(layout.includes("ellipsizeMode"), false);
  assert.equal(layout.includes("adjustsFontSizeToFit"), false);
});

test("tab labels have explicit line geometry and the bar leaves room for Android font-size +1", () => {
  const labelStyle = layout.match(/tabBarLabelStyle:\s*\{([^}]+)\}/);
  assert.ok(labelStyle, "tabBarLabelStyle must be present");
  const lineHeight = Number(/lineHeight:\s*(\d+)/.exec(labelStyle[1] ?? "")?.[1]);
  const fontSize = Number(/fontSize:\s*(\d+)/.exec(labelStyle[1] ?? "")?.[1]);
  assert.equal(fontSize, 12);
  assert.ok(lineHeight >= 16, `label lineHeight ${lineHeight} must be at least 16`);

  assert.equal(layout.includes("useSafeAreaInsets"), true);
  assert.match(layout, /Math\.max\(insets\.bottom,\s*10\)/);
  assert.match(layout, /minHeight:\s*62\s*\+\s*tabBarPaddingBottom/);
  assert.equal(layout.includes("paddingBottom: 6"), false);
  assert.equal(/tabBarStyle:\s*\{\s*minHeight:\s*64,\s*paddingTop:\s*6,\s*paddingBottom:\s*6\s*\}/.test(layout), false);
});
