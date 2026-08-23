import assert from "node:assert/strict";
import test from "node:test";
import { parseLessonBlocks, parseQuiz, parseStringList, parseVocabulary, showMmToggle } from "../src/api/lesson.ts";
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

test("quiz parser surfaces the source answer key and explanation, never invents one", () => {
  const keyed = parseQuiz([
    { question: "Q?", options: ["A", "B", "C"], correct_index: 2, explanation: "Because C." },
  ]);
  assert.equal(keyed[0]?.correctIndex, 2);
  assert.equal(keyed[0]?.explanation, "Because C.");

  // Alternate key spellings seen in production rows
  assert.equal(parseQuiz([{ question: "Q?", options: ["A", "B"], correct: 1 }])[0]?.correctIndex, 1);
  assert.equal(parseQuiz([{ question: "Q?", options: ["A", "B"], correctAnswer: 0 }])[0]?.correctIndex, 0);
  assert.equal(parseQuiz([{ q: "Q?", answers: ["A", "B"], correct_index: 1 }])[0]?.correctIndex, 1);

  // Missing or out-of-range keys stay null — the UI must not guess.
  assert.equal(parseQuiz([{ question: "Q?", options: ["A", "B"] }])[0]?.correctIndex, null);
  assert.equal(parseQuiz([{ question: "Q?", options: ["A", "B"], correct_index: 9 }])[0]?.correctIndex, null);
});

test("string-list parser handles JSON arrays, newline text, and junk", () => {
  assert.deepEqual(parseStringList('["One","Two"]'), ["One", "Two"]);
  assert.deepEqual(parseStringList(["One", " ", "Two"]), ["One", "Two"]);
  assert.deepEqual(parseStringList("First step\nSecond step"), ["First step", "Second step"]);
  assert.deepEqual(parseStringList(""), []);
  assert.deepEqual(parseStringList(null), []);
  assert.deepEqual(parseStringList(42), []);
});

test("vocabulary parser reads glossary rows and skips incomplete entries", () => {
  const rows = parseVocabulary(
    JSON.stringify([
      { term: "Shortlist", meaning: "နောက်ဆုံးရွေးထားတဲ့ စာရင်း", definition: "Final candidate list." },
      { termEn: "Brief", meaningMm: "အကျဉ်းချုပ်" },
      { term: "NoMeaning" },
      "junk",
    ]),
  );
  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.term, "Shortlist");
  assert.equal(rows[0]?.definition, "Final candidate list.");
  assert.equal(rows[1]?.term, "Brief");
  assert.equal(rows[1]?.definition, null);
  assert.equal(parseVocabulary("not-json").length, 0);
});
