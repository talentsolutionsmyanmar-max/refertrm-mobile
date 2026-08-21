import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(import.meta.dirname, "..");

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === "tests" || name === "docs") continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, acc);
    else acc.push(path);
  }
  return acc;
}

test("no supabase client, secrets, apply screens, or Z assets", () => {
  const files = walk(root).filter((path) => /\.(ts|tsx|js|json)$/.test(path));
  const leftover: string[] = [];
  for (const file of files) {
    const rel = relative(root, file);
    const text = readFileSync(file, "utf8");
    if (/createClient\(|supabaseUrl|supabaseKey|SERVICE_ROLE|service_role|eyJhbGci/.test(text)) {
      leftover.push(`secret:${rel}`);
    }
  }
  const zFiles = walk(join(root, "assets")).filter((path) => /z-mark|logo\.svg/.test(path));
  const screens = walk(join(root, "app")).map((path) => relative(join(root, "app"), path));
  assert.deepEqual(leftover, []);
  assert.deepEqual(zFiles, []);
  assert.equal(screens.some((name) => /(^|\/)(apply|profile|sign-in|login)/i.test(name)), false);
});
