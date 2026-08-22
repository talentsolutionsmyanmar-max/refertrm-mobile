import { asPlainText } from "./text";
import type { AcademyModuleDetail } from "./types";

/** Parse a JSON array of strings (or a newline-separated string) into a clean list. */
export function parseStringList(raw: unknown): string[] {
  let value: unknown = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      value = JSON.parse(trimmed);
    } catch {
      return raw
        .split("\n")
        .map((line) => asPlainText(line).replace(/^[-*\d.)\s]+/, "").trim())
        .filter(Boolean);
    }
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === "string" ? asPlainText(entry) : ""))
    .filter((entry) => entry.trim().length > 0);
}

/** Footnote-glossary row: EN term + Myanmar gloss (platform standard). */
export type VocabularyTerm = {
  term: string;
  meaning: string;
  definition: string | null;
};

export function parseVocabulary(raw: unknown): VocabularyTerm[] {
  let value: unknown = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      value = JSON.parse(trimmed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const rec = item as Record<string, unknown>;
    const term =
      typeof rec.term === "string" ? rec.term : typeof rec.termEn === "string" ? rec.termEn : typeof rec.en === "string" ? rec.en : "";
    const meaning =
      typeof rec.meaning === "string"
        ? rec.meaning
        : typeof rec.meaningMm === "string"
          ? rec.meaningMm
          : typeof rec.mm === "string"
            ? rec.mm
            : "";
    if (!term.trim() || !meaning.trim()) return [];
    const definition =
      typeof rec.definition === "string" && rec.definition.trim() ? asPlainText(rec.definition) : null;
    return [{ term: asPlainText(term), meaning: meaning.trim(), definition }];
  });
}

export type LessonBlock = {
  type: string;
  title?: string;
  content?: string;
};

export function parseLessonBlocks(raw: unknown): LessonBlock[] {
  let value: unknown = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      value = JSON.parse(trimmed);
    } catch {
      return [{ type: "text", content: asPlainText(raw) }];
    }
  }
  if (!Array.isArray(value)) return [];
  return value.flatMap((block) => {
    if (!block || typeof block !== "object") return [];
    const rec = block as Record<string, unknown>;
    const content = typeof rec.content === "string" ? asPlainText(rec.content) : "";
    const title = typeof rec.title === "string" ? asPlainText(rec.title) : undefined;
    const type = typeof rec.type === "string" ? rec.type : "text";
    return [{ type, title, content }];
  });
}

export function hasMmBody(detail: Pick<AcademyModuleDetail, "contentMm">): boolean {
  return parseLessonBlocks(detail.contentMm).some((b) => (b.content ?? "").trim().length > 0);
}

/**
 * Toggle only when a Myanmar body exists.
 * Catalogue mmReady (when known) AND detail mmContentReady must both be true.
 * Direct deep links without catalogue use mmContentReady + body only.
 */
export function showMmToggle(
  catalogMmReady: boolean | undefined,
  detail: AcademyModuleDetail,
): boolean {
  if (!hasMmBody(detail) || !detail.mmContentReady) return false;
  if (catalogMmReady === false) return false;
  return true;
}

export type QuizItem = {
  question: string;
  options: string[];
  /**
   * Index into options of the keyed-correct answer, when the source row
   * carries a key (correct_index / correct / correctAnswer). Null when the
   * source does not say — in that case the UI must not guess or fabricate.
   */
  correctIndex: number | null;
  explanation: string | null;
};

function resolveCorrectIndex(raw: unknown, optionsLength: number): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw < optionsLength) {
    return raw;
  }
  if (typeof raw === "string" && raw.trim()) {
    const numeric = Number(raw);
    if (Number.isInteger(numeric) && numeric >= 0 && numeric < optionsLength) return numeric;
  }
  return null;
}

export function parseQuiz(raw: unknown): QuizItem[] {
  let value: unknown = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      value = JSON.parse(trimmed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const rec = item as Record<string, unknown>;
    const questionRaw = rec.question ?? rec.q;
    const question = typeof questionRaw === "string" ? asPlainText(questionRaw) : "";
    const optionsRaw = Array.isArray(rec.options)
      ? rec.options
      : Array.isArray(rec.answers)
        ? rec.answers
        : [];
    const options = optionsRaw.filter((o): o is string => typeof o === "string").map(asPlainText);
    if (!question || options.length === 0) return [];
    const correctIndex = resolveCorrectIndex(
      rec.correctIndex ?? rec.correct_index ?? rec.correct ?? rec.correctAnswer ?? rec.answer,
      options.length,
    );
    const explanationRaw = rec.explanation ?? rec.rationale ?? rec.feedback;
    const explanation =
      typeof explanationRaw === "string" && explanationRaw.trim()
        ? asPlainText(explanationRaw)
        : null;
    return [{ question, options, correctIndex, explanation }];
  });
}
