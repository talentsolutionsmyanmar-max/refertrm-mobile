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
  assert.equal(src.includes("copyMm.academy.count"), true);
  assert.equal(src.includes("copyMm.academy.search"), true);
  assert.equal(src.includes("copyMm.academy.allTopics"), true);
  assert.equal(src.includes("copyMm.academy.empty"), true);
  assert.equal(src.includes("mmOnly"), false);
  assert.equal(src.includes("mmReadyCount"), false);
  assert.equal(src.includes("myanmarAvailable"), false);
  assert.equal(/filterModules\(modules, search, category, false\)/.test(src), true);
  assert.equal(src.includes("emptyOffline"), false);
  assert.equal(src.includes("item.mmReady"), false);
});

test("empty catalogue errors do not render simultaneous zero-count claims", () => {
  const jobsSrc = readFileSync(join(root, "app/(tabs)/jobs.tsx"), "utf8");
  const academySrc = readFileSync(join(root, "app/(tabs)/learn.tsx"), "utf8");

  assert.equal(jobsSrc.includes("const hasEmptyError = jobs.length === 0 && query.isError"), true);
  assert.equal(jobsSrc.includes("{!hasEmptyError ? ("), true);
  assert.equal(jobsSrc.includes("{hasEmptyError ? ("), true);
  assert.equal(academySrc.includes("const hasEmptyError = modules.length === 0 && query.isError"), true);
  assert.equal(academySrc.includes("{!hasEmptyError ? ("), true);
  assert.equal(academySrc.includes("{hasEmptyError ? ("), true);
});

test("lesson screen restores source-bound Myanmar toggle and body modes, English quiz only", () => {
  const src = readFileSync(join(root, "app/learn/[slug].tsx"), "utf8");
  assert.equal(src.includes("quizQuestionsMm"), false);
  assert.equal(/parseQuiz\(module\.quizQuestions\)/.test(src), true);
  assert.equal(src.includes("QuizRunner"), true);
  assert.equal(/<QuizRunner items=\{quiz\} mm=\{false\}/.test(src), true);
  assert.equal(/QuizRunner[^>]*mm=\{mm\}/.test(src), false);
  assert.equal(src.includes("mmHidden"), false);
  assert.equal(src.includes("showMmToggle"), true);
  assert.equal(src.includes("canToggle"), true);
  assert.equal(/showMmToggle\(listed\?.*mmReady, module\)/.test(src), true);
  assert.equal(/parseStringList\(mm \? module\.actionStepsMm : module\.actionSteps\)/.test(src), true);
  assert.equal(src.includes("contentMm"), true);
  assert.equal(src.includes("titleMm"), true);
  assert.equal(/parseVocabulary\(module\.vocabularyMm\)/.test(src), true);
  assert.equal(src.includes("copyMm.academy.languageEn"), true);
  assert.equal(src.includes("copyMm.academy.languageMm"), true);
  assert.equal(src.includes("{copyMm.errors.notFound}"), true);
  assert.equal(src.includes("<Card label={copyMm.academy.questions}>"), true);
  assert.equal(src.includes("{copy.errors.notFound}"), false);
  assert.equal(src.includes("<Card label={copy.academy.quizTitle}>"), false);
});

test("mm.ts exact CCO bytes unchanged (PR #8 blob)", () => {
  const mmSrc = readFileSync(join(root, "src/copy/mm.ts"), "utf8");
  assert.equal(Buffer.byteLength(mmSrc, "utf8"), 1108);
  const { createHash } = require("node:crypto");
  const hash = createHash("sha256").update(mmSrc).digest("hex");
  assert.equal(hash, "ecbd1ce3d3bc7b71c90e288842f78b206cdf2275a772e8f38c848aef942610a9");
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
