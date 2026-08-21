import assert from "node:assert/strict";
import test from "node:test";
import { parseLessonBlocks, parseQuiz, showMmToggle } from "../src/api/lesson.ts";
import type { AcademyModuleDetail } from "../src/api/types.ts";

const detail: AcademyModuleDetail = {
  id: "cmmxl27790019lq6737n3ev18",
  slug: "serve-with-dignity-how-confident-service-gets-you-promoted-faster-than-silent-obedience",
  titleEn: "Serve with Dignity",
  titleMm: "ခေါင်းစဉ်",
  category: "Hospitality",
  durationMinutes: 12,
  xpReward: 20,
  content: [{ type: "takeaway", title: "Key Takeaway", content: "Be visible." }],
  contentMm: null,
  mmContentReady: false,
  hookTextMm: null,
  keyTakeawayMm: null,
  commonMistakeMm: null,
  actionStepsMm: null,
  decisionScenarioMm: null,
  difficultyLevel: null,
};

test("preserves source block order and strips accidental HTML", () => {
  const blocks = parseLessonBlocks([
    { type: "hook", title: "The Story", content: "Hello" },
    { type: "action", title: "Action 1", content: "<b>Watch</b> a clip" },
    { type: "takeaway", title: "Key Takeaway", content: "Remember" },
  ]);
  assert.deepEqual(blocks.map((b) => b.type), ["hook", "action", "takeaway"]);
  assert.equal(blocks[1]?.content, "Watch a clip");
});

test("parses JSON string Myanmar bodies and hides empty toggle", () => {
  const mm = JSON.stringify([{ type: "text", content: "မြန်မာ" }]);
  assert.equal(showMmToggle(true, { ...detail, mmContentReady: true, contentMm: mm }), true);
  assert.equal(showMmToggle(undefined, { ...detail, mmContentReady: true, contentMm: mm }), true);
  assert.equal(showMmToggle(true, { ...detail, mmContentReady: true, contentMm: "[]" }), false);
  assert.equal(showMmToggle(false, { ...detail, mmContentReady: true, contentMm: mm }), false);
});

test("quiz parser ignores malformed rows and JSON strings", () => {
  const items = parseQuiz([{ question: "Q?", options: ["A", "B"] }, { question: "Nope" }]);
  assert.equal(items.length, 1);
  assert.equal(parseQuiz("not-json").length, 0);
});
