import assert from "node:assert/strict";
import test from "node:test";
import { parseModuleDetail, parseModuleEnvelope, parseModuleListItem } from "../src/api/parse.ts";
import { showMmToggle } from "../src/api/lesson.ts";

/**
 * Mirror of the live API module payload captured on device QA
 * (rerun-46, 2026-11-05): the MM readiness flag arrives snake_case
 * (mm_content_ready) while MM content fields arrive camelCase (contentMm).
 */
function livePayload(): Record<string, unknown> {
  return {
    success: true,
    module: {
      id: "mod-46",
      slug: "serve-with-dignity",
      titleEn: "Serve with Dignity",
      titleMm: "ဂုဏ်သိက္ခာဖြင့် ဝန်ဆောင်ရန်",
      category: "ops",
      durationMinutes: 8,
      xp_reward: 50,
      content: '[{"type":"text","content":"English body"}]',
      contentMm: '[{"type":"hook","content":"မြန်မာ စာကိုယ်ထည်"}]',
      mm_content_ready: true,
      isPublished: true,
      further_reading_url: "https://example.com/dignity",
      further_reading_label: "Learn more",
    },
  };
}

test("snake_case mm_content_ready payload parses and the MM toggle becomes ready (F-2)", () => {
  const detail = parseModuleEnvelope(livePayload());
  assert.equal(detail.mmContentReady, true);
  assert.equal(detail.xpReward, 50);
  assert.equal(detail.furtherReadingUrl, "https://example.com/dignity");
  assert.equal(detail.furtherReadingLabel, "Learn more");
  // Toggle gate the lesson screen applies (catalogue mmReady camelCase = 11 lessons)
  assert.equal(showMmToggle(true, detail), true);
  assert.equal(showMmToggle(false, detail), false);
});

test("camelCase payloads keep working unchanged", () => {
  const payload = livePayload();
  const inner = payload.module as Record<string, unknown>;
  delete inner.mm_content_ready;
  delete inner.xp_reward;
  delete inner.further_reading_url;
  delete inner.further_reading_label;
  inner.mmContentReady = true;
  inner.xpReward = 30;
  inner.furtherReadingUrl = "https://example.com/camel";
  inner.furtherReadingLabel = "More";
  const detail = parseModuleDetail(payload);
  assert.equal(detail?.mmContentReady, true);
  assert.equal(detail?.xpReward, 30);
  assert.equal(detail?.furtherReadingUrl, "https://example.com/camel");
  assert.equal(showMmToggle(true, detail!), true);
});

test("snake_case wins when both casings are present; absent flag stays undefined", () => {
  const payload = livePayload();
  const inner = payload.module as Record<string, unknown>;
  inner.mmContentReady = false;
  inner.mm_ready = true;
  let detail = parseModuleDetail(payload)!;
  assert.equal(detail.mmContentReady, true);
  assert.equal(detail.mmReady, true);

  delete inner.mm_content_ready;
  delete inner.mm_ready;
  delete inner.mmContentReady;
  inner.mmReady = false;
  detail = parseModuleDetail(payload)!;
  assert.equal(detail.mmContentReady, undefined);
  assert.equal(detail.mmReady, false);
  assert.equal(showMmToggle(true, detail), false);
});

test("module list items accept snake_case mm_ready alongside camelCase", () => {
  const base = {
    id: "mod-1",
    slug: "serve-with-dignity",
    titleEn: "Serve with Dignity",
    category: "ops",
  };
  assert.equal(parseModuleListItem({ ...base, mm_ready: true })?.mmReady, true);
  assert.equal(parseModuleListItem({ ...base, mmReady: true })?.mmReady, true);
  assert.equal(parseModuleListItem({ ...base })?.mmReady, false);
});
