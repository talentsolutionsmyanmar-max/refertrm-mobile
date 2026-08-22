import { asPlainText } from "./text";
import type { AcademyModuleDetail } from "./types";

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
};

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
    const question = typeof rec.question === "string" ? asPlainText(rec.question) : "";
    const options = Array.isArray(rec.options)
      ? rec.options.filter((o): o is string => typeof o === "string").map(asPlainText)
      : [];
    if (!question || options.length === 0) return [];
    return [{ question, options }];
  });
}
