import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, acc);
    else acc.push(path);
  }
  return acc;
}

test("no supabase client, secrets, apply screens, or retired-symbol references", () => {
  const files = walk(root).filter((path) => /\.(ts|tsx|js|json|md)$/.test(path));
  const leftover: string[] = [];
  const needleA = ["z", "mark"].join("-");
  const needleB = ["z", "mark"].join("");
  const needleC = ["Z", "mark"].join("-");
  const needleD = ["Z", " symbol"].join("");
  const svgA = ["logo", "svg"].join(".");
  const svgB = [needleA, "svg"].join(".");
  const retired = [needleA, needleB, needleC, needleD, svgA, svgB];
  for (const file of files) {
    const rel = relative(root, file);
    if (rel.startsWith("tests" + "/") || rel.startsWith("tests\\")) continue;
    if (rel === "docs/D-022-bearer-session.md") continue;
    const text = readFileSync(file, "utf8");
    if (/createClient\(|supabaseUrl|supabaseKey|SERVICE_ROLE|service_role|eyJhbGci/.test(text)) {
      leftover.push(`secret:${rel}`);
    }
    for (const needle of retired) {
      if (text.includes(needle)) leftover.push(`retired:${rel}:${needle}`);
    }
  }
  const screens = walk(join(root, "app")).map((path) => relative(join(root, "app"), path));
  assert.deepEqual(leftover, []);
  assert.equal(screens.some((name) => /(^|\/)(apply|profile|sign-in|login)/i.test(name)), false);
});
