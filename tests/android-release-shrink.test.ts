import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
const plugins: unknown[] = app.expo.plugins;
const entry = plugins.find((p) => Array.isArray(p) && p[0] === "expo-build-properties") as
  | [string, { android?: Record<string, unknown> }]
  | undefined;

assert.ok(entry, "expo-build-properties plugin configured");
const android = entry[1].android ?? {};
assert.equal(android.enableMinifyInReleaseBuilds, true, "R8 minify on for release builds");
assert.equal(android.enableShrinkResourcesInReleaseBuilds, true, "resource shrinking on for release builds");
const rules = String(android.extraProguardRules ?? "");
assert.ok(rules.includes("-keep class com.reactnativecommunity.netinfo.**"), "NetInfo keep rule");
assert.ok(rules.includes("-keep class com.mrousavy.mmkv.**"), "MMKV keep rule");

console.log("android-release-shrink PASS");
