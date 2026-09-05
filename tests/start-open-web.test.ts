import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const startSrc = fs.readFileSync(path.join(root, "src/linking/start.ts"), "utf8");

assert.equal(startSrc.includes("googlechrome://"), false, "must not use googlechrome://navigate");

function hostOf(constName: string): string {
  const match = startSrc.match(new RegExp(`export const ${constName} = "([^"]+)"`));
  assert.ok(match, `${constName} must be exported`);
  const url = new URL(match[1]);
  return url.hostname;
}

assert.equal(hostOf("START_URL"), "www.refertrm.com");
assert.equal(hostOf("GAME_URL"), "www.refertrm.com");
assert.equal(hostOf("LOGIN_TRINITY"), "www.refertrm.com");

function isHttpsStartUrl(raw: string): boolean {
  const url = new URL(raw.trim());
  if (url.protocol.toLowerCase() !== "https:") return false;
  const host = url.hostname.toLowerCase();
  if (host !== "www.refertrm.com" && host !== "refertrm.com") return false;
  const pathName = (url.pathname || "/").replace(/\/+$/, "") || "/";
  return pathName.toLowerCase() === "/start";
}

assert.equal(isHttpsStartUrl("https://www.refertrm.com/start"), true);
assert.ok(startSrc.includes("export function isHttpsStartUrl"));
assert.ok(startSrc.includes("export async function openWeb"));

console.log("start-open-web PASS");
