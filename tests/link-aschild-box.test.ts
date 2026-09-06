import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * G3 (Option B) — a gate that can see the invisible-button class.
 * <Link asChild><Pressable> drops the child's own box styles on device
 * (proved on the CEO's A23: gold "See all jobs" rendered as flat text).
 * Forbid box-affecting style keys on a Pressable that is a direct child of
 * <Link asChild>. Box styles belong on an inner View; the Pressable under
 * asChild carries press feedback only.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// Box-affecting = visual box (paint/shape/space), NOT press-target geometry.
// minHeight/justifyContent are feedback/affordance and are allowed on the Pressable.
const BOX_KEYS = /(backgroundColor|borderRadius|borderWidth|padding)\s*:/;

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop()!;
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.endsWith(".tsx")) out.push(full);
    }
  }
  return out;
}

test("G3 — no box-affecting styles on a Pressable that is a direct child of Link asChild", () => {
  const files = tsxFiles(join(root, "app"));
  const offenders: string[] = [];
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    // Walk each <Link ... asChild> ... </Link> block.
    const linkRe = /<Link\b[^>]*\basChild\b[^>]*>([\s\S]*?)<\/Link>/g;
    for (const m of src.matchAll(linkRe)) {
      const block = m[1];
      const pressableIdx = block.search(/<Pressable\b/);
      if (pressableIdx === -1) continue;
      // Only the Pressable's OWN opening tag + style prop — stop at the first
      // child element (<View, <Text), which is where box styles legitimately live.
      const rest = block.slice(pressableIdx);
      const firstChild = rest.search(/<(View|Text)\b/);
      const pressableOpen = firstChild === -1 ? rest : rest.slice(0, firstChild);
      if (BOX_KEYS.test(pressableOpen)) {
        const line = src.slice(0, m.index!).split("\n").length;
        offenders.push(`${file}:${line}`);
      }
    }
  }
  assert.deepEqual(offenders, [], `box styles on asChild Pressables: ${offenders.join(", ")}`);
});

test("G1 — MOB.HOME.PRIMARY paints gold on the inner View, not the asChild Pressable", () => {
  const home = readFileSync(join(root, "app/(tabs)/home.tsx"), "utf8");
  // The gold box must be on an inner View inside the asChild Pressable.
  // Gold token reads t.accents.gold or color.gold through the theme.
  const primaryBlock = home.slice(home.indexOf("MOB.HOME.PRIMARY"));
  const goldOnView = /<View[^>]*style=\{\{[\s\S]*?backgroundColor:\s*(t\.accents\.gold|color\.gold)/.test(primaryBlock);
  assert.ok(goldOnView, "gold box must be on an inner View so it paints on device");
});
