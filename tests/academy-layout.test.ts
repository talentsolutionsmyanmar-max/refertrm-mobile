import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACADEMY_QA_VIEWPORT,
  COURSE_CARD_MIN_HEIGHT,
  academyChromeHeight,
  academyListVisibleHeight,
} from "../src/ui/academyChrome.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("academy topic chips are a horizontal scroller, not a wrapping block", () => {
  const src = readFileSync(join(root, "app/(tabs)/learn.tsx"), "utf8");
  assert.equal(src.includes("flexWrap"), false);
  assert.equal(/ScrollView[\s\S]*horizontal/.test(src), true);
  assert.equal(/FlatList[\s\S]*style=\{\{ flex: 1 \}\}/.test(src), true);
  assert.equal(src.includes("copy.academy.search"), true);
  assert.equal(src.includes("copy.academy.myanmarAvailable"), true);
});

test("course list keeps visible space at 390x844 without scrolling categories", () => {
  assert.equal(ACADEMY_QA_VIEWPORT.width, 390);
  assert.equal(ACADEMY_QA_VIEWPORT.height, 844);
  const chrome = academyChromeHeight();
  const list = academyListVisibleHeight();
  assert.ok(chrome < 250, `chrome ${chrome} should stay a compact band`);
  assert.ok(list > COURSE_CARD_MIN_HEIGHT, `list ${list} must fit a course card`);
  assert.ok(list > 400, `list ${list} should show the first card without category wrapping`);
});
