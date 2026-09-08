import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hasMmBody, parseLessonBlocks, parseQuiz, showMmToggle } from "../src/api/lesson.ts";
import type { AcademyModuleDetail } from "../src/api/types.ts";
import { font } from "../src/theme.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lessonPath = join(root, "app/learn/[slug].tsx");

function lessonSource(): string {
  return readFileSync(lessonPath, "utf8");
}

/** Extract mm ? {A} : {B} style expression bodies from the production lesson screen. */
function extractMmStyleTernaries(src: string): { mmBranch: string; enBranch: string }[] {
  const out: { mmBranch: string; enBranch: string }[] = [];
  const re = /style=\{\s*\n?\s*mm\s*\n?\s*\?\s*(\{[\s\S]*?\})\s*\n?\s*:\s*(\{[\s\S]*?\})\s*\n?\s*\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(src))) {
    out.push({ mmBranch: match[1], enBranch: match[2] });
  }
  return out;
}

function evalStyle(branch: string, mm: boolean, mmLh: number): Record<string, unknown> {
  // Evaluate the production object literal with the same bindings the screen uses.
  // eslint-disable-next-line no-new-func
  const fn = new Function("font", "MM_LH", "Math", "mm", `return (${branch});`);
  return fn(font, mmLh, Math, mm) as Record<string, unknown>;
}

function detail(partial: Partial<AcademyModuleDetail>): AcademyModuleDetail {
  return {
    id: "m1",
    slug: "demo",
    titleEn: "Demo Lesson",
    titleMm: null,
    category: "ops",
    durationMinutes: null,
    xpReward: null,
    content: [{ type: "text", title: "EN", content: "English body" }],
    contentMm: null,
    mmContentReady: false,
    mmReady: false,
    isPublished: true,
    difficultyLevel: null,
    quizQuestions: null,
    quizQuestionsMm: null,
    learningObjectives: null,
    furtherReadingUrl: null,
    furtherReadingLabel: null,
    hookText: null,
    keyTakeaway: null,
    commonMistake: null,
    actionSteps: null,
    decisionScenario: null,
    hookTextMm: null,
    keyTakeawayMm: null,
    commonMistakeMm: null,
    actionStepsMm: null,
    decisionScenarioMm: null,
    vocabularyMm: null,
    ...partial,
  };
}

test("lesson English mode retains base typography values on the production screen", () => {
  const src = lessonSource();
  const mmLh = Number(/const MM_LH = ([0-9.]+)/.exec(src)?.[1]);
  assert.equal(mmLh, 1.8);
  const ternaries = extractMmStyleTernaries(src);
  assert.equal(ternaries.length, 3, "expected title, heading, and body mm ternaries");

  const [title, heading, body] = ternaries.map((t) => evalStyle(t.enBranch, false, mmLh));
  assert.deepEqual(title, { color: "#001F3F", fontSize: 24, fontWeight: "800", marginTop: 4 });
  assert.equal(title.fontFamily, undefined);
  assert.deepEqual(heading, { color: "#001F3F", fontWeight: "700", fontSize: 16 });
  assert.equal(heading.fontFamily, undefined);
  assert.deepEqual(body, { color: "#001F3F", marginTop: 8, lineHeight: 22 });
  assert.equal(body.fontFamily, undefined);

  // No Padauk family string appears in any EN branch source
  for (const t of ternaries) {
    assert.equal(t.enBranch.includes("font.myanmar"), false);
    assert.equal(t.enBranch.includes("Padauk"), false);
  }
});

test("lesson Myanmar mode selects Padauk faces and intended line geometry on the production screen", () => {
  const src = lessonSource();
  const mmLh = Number(/const MM_LH = ([0-9.]+)/.exec(src)?.[1]);
  assert.equal(font.myanmar, "Padauk-400");
  assert.equal(font.myanmarBold, "Padauk-700");
  const ternaries = extractMmStyleTernaries(src);
  assert.equal(ternaries.length, 3);

  const [title, heading, body] = ternaries.map((t) => evalStyle(t.mmBranch, true, mmLh));
  assert.equal(title.fontFamily, font.myanmarBold);
  assert.equal(title.fontSize, 24);
  assert.equal(title.lineHeight, Math.round(24 * mmLh));
  assert.equal(title.lineHeight, 43);

  assert.equal(heading.fontFamily, font.myanmarBold);
  assert.equal(heading.fontSize, 16);
  assert.equal(heading.lineHeight, Math.round(16 * mmLh));
  assert.equal(heading.lineHeight, 29);

  assert.equal(body.fontFamily, font.myanmar);
  assert.equal(body.fontSize, 16);
  assert.equal(body.lineHeight, Math.round(16 * mmLh));
  assert.equal(body.lineHeight, 29);

  assert.ok(ternaries[0].mmBranch.includes("font.myanmarBold"));
  assert.ok(ternaries[1].mmBranch.includes("font.myanmarBold"));
  assert.ok(ternaries[2].mmBranch.includes("font.myanmar"));
  assert.equal(ternaries[2].mmBranch.includes("font.myanmarBold"), false);
});

test("typography follows the same mm state as content selection and quiz suppression", () => {
  const src = lessonSource();
  assert.match(src, /const \[mm, setMm\] = useState\(false\)/);
  assert.match(
    src,
    /showMmToggle\(Boolean\(listed\?\.mmReady \?\? module\.mmReady\), module\)/,
  );
  assert.match(src, /parseLessonBlocks\(mm \? module\.contentMm : module\.content\)/);
  assert.match(src, /const quiz = module && !mm \? parseQuiz\(module\.quizQuestions\) : \[\]/);
  assert.match(src, /mm && module\?\.titleMm \? module\.titleMm/);

  // Every Padauk style site is gated by the same mm identifier (ternary count)
  const ternaries = extractMmStyleTernaries(src);
  assert.equal(ternaries.length, 3);
  // Padauk tokens only appear inside mm branches of those ternaries
  const withoutEn = ternaries.map((t) => t.mmBranch).join("\n");
  assert.ok(withoutEn.includes("font.myanmarBold"));
  assert.ok(withoutEn.includes("font.myanmar"));
  for (const t of ternaries) {
    assert.equal(/font\.myanmar/.test(t.enBranch), false);
  }

  // Real gate helper: typography path is unreachable when readiness/body fails
  const ready = detail({
    contentMm: [{ type: "text", content: "mm body" }],
    mmContentReady: true,
    titleMm: "MM title",
  });
  assert.equal(hasMmBody(ready), true);
  assert.equal(showMmToggle(true, ready), true);
  assert.equal(showMmToggle(false, ready), false);
  assert.equal(showMmToggle(true, detail({ contentMm: null, mmContentReady: true })), false);
  assert.equal(
    showMmToggle(true, detail({ contentMm: [{ type: "text", content: "x" }], mmContentReady: false })),
    false,
  );

  // Content selection / quiz suppression mirror screen expressions for mm true/false
  const mmOff = false;
  const mmOn = true;
  const enBlocks = parseLessonBlocks(mmOff ? ready.contentMm : ready.content);
  const mmBlocks = parseLessonBlocks(mmOn ? ready.contentMm : ready.content);
  assert.equal(enBlocks[0]?.content, "English body");
  assert.equal(mmBlocks[0]?.content, "mm body");
  const quizRaw = [{ question: "Q?", options: ["a", "b"], correct_index: 0 }];
  const quizEn = ready && !mmOff ? parseQuiz(quizRaw) : [];
  const quizMm = ready && !mmOn ? parseQuiz(quizRaw) : [];
  assert.ok(quizEn.length >= 1);
  assert.equal(quizMm.length, 0);
});
