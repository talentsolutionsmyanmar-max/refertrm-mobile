import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const startPath = path.join(root, "app", "start.tsx");

const FORBIDDEN = [
  /\bsession\b/i,
  /SecureStore/,
  /src\/api\/client/,
  /from\s+["']@\/src\/api/,
  /src\/api/,
  /\bendpoints\b/i,
  /\bapply\b/i,
  /\bpayout\b/i,
  /referral-write/i,
  /WebView/,
];

function loadTsconfigPaths() {
  const tsconfig = JSON.parse(fs.readFileSync(path.join(root, "tsconfig.json"), "utf8"));
  return tsconfig.compilerOptions?.paths ?? {};
}

function mapAlias(spec, pathsConfig) {
  for (const [pattern, targets] of Object.entries(pathsConfig)) {
    if (!Array.isArray(targets) || targets.length === 0) continue;
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -1);
      if (spec.startsWith(prefix)) {
        const rest = spec.slice(prefix.length);
        const target = targets[0];
        const mapped = target.endsWith("/*") ? `${target.slice(0, -1)}${rest}` : target;
        return path.resolve(root, mapped);
      }
    } else if (spec === pattern) {
      return path.resolve(root, targets[0]);
    }
  }
  return null;
}

function resolveFile(baseWithoutExt) {
  const candidates = [
    baseWithoutExt,
    `${baseWithoutExt}.ts`,
    `${baseWithoutExt}.tsx`,
    `${baseWithoutExt}.js`,
    `${baseWithoutExt}.mjs`,
    path.join(baseWithoutExt, "index.ts"),
    path.join(baseWithoutExt, "index.tsx"),
  ];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) ?? null;
}

function resolveImport(fromFile, spec, pathsConfig) {
  if (spec.startsWith(".")) {
    return { resolved: resolveFile(path.resolve(path.dirname(fromFile), spec)), viaAlias: false };
  }
  const mapped = mapAlias(spec, pathsConfig);
  if (mapped) {
    return { resolved: resolveFile(mapped), viaAlias: true };
  }
  return { resolved: null, viaAlias: false };
}

function collectGraph(entry, pathsConfig) {
  const seen = new Set();
  const queue = [entry];
  const files = [];
  const aliasResolved = [];
  let aliasCount = 0;
  while (queue.length) {
    const file = queue.pop();
    const abs = path.resolve(file);
    if (seen.has(abs)) continue;
    seen.add(abs);
    files.push(abs);
    const text = fs.readFileSync(abs, "utf8");
    const re = /from\s+["']([^"']+)["']/g;
    let m;
    while ((m = re.exec(text))) {
      const spec = m[1];
      const { resolved, viaAlias } = resolveImport(abs, spec, pathsConfig);
      if (viaAlias && resolved) {
        aliasCount += 1;
        aliasResolved.push({ from: path.relative(root, abs), spec, to: path.relative(root, resolved) });
      }
      if (resolved) queue.push(resolved);
    }
  }
  return { files, aliasCount, aliasResolved };
}

const pathsConfig = loadTsconfigPaths();
assert.deepEqual(pathsConfig["@/*"], ["./*"], "tsconfig must map @/* to ./*");

const { files: graph, aliasCount, aliasResolved } = collectGraph(startPath, pathsConfig);
assert.ok(graph.length >= 1, "start screen graph must include the entry file");
assert.ok(
  aliasCount >= 1,
  "start graph must resolve at least one @/ alias import (got 0)",
);
console.log("alias-resolved", aliasCount, JSON.stringify(aliasResolved));

for (const file of graph) {
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of FORBIDDEN) {
    assert.equal(
      pattern.test(text),
      false,
      `${path.relative(root, file)} must not mention ${pattern}`,
    );
  }
}

const tabs = fs.readFileSync(path.join(root, "app", "(tabs)", "_layout.tsx"), "utf8");
const screens = [...tabs.matchAll(/<Tabs\.Screen\s+name=["']([^"']+)["']/g)].map((m) => m[1]);
assert.equal(screens.length, 2, "tabs layout must have exactly two Tabs.Screen");
assert.ok(!screens.includes("start"), "tabs layout must not register a start tab");

console.log("start-boundary PASS");
console.log("graph", graph.map((f) => path.relative(root, f)).join(", "));
