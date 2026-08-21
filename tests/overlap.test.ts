import assert from "node:assert/strict";
import test from "node:test";
import { catalog } from "../src/cache/catalog.ts";
import { resetGenerations } from "../src/cache/generation.ts";
import { loadAcademy, loadJobs, loadModule } from "../src/api/load.ts";
import { resetMemoryKv } from "../src/storage/kv.ts";

type Pending = { url: string; resolve: (value: Response) => void };

function jobPayload(id: string) {
  return {
    jobs: [
      {
        id,
        title: id,
        slug: id,
        status: "active",
        companyId: "c",
        company: { id: "c", name: "Acme" },
        description: id,
        location: "Yangon",
        type: "full_time",
        urgent: false,
        createdAt: "2026-01-01",
      },
    ],
  };
}

function academyPayload(id: string) {
  return {
    success: true,
    count: 1,
    modules: [
      {
        id,
        titleEn: id,
        titleMm: null,
        category: "Hospitality",
        durationMinutes: 10,
        xpReward: 5,
        level: null,
        order: 1,
        slug: id,
        ksaFamily: null,
        ksaLevel: null,
        mmReady: false,
        quizCount: 0,
      },
    ],
  };
}

function modulePayload(id: string, titleEn = id) {
  return {
    success: true,
    module: {
      id,
      slug: id,
      titleEn,
      titleMm: null,
      category: "Hospitality",
      durationMinutes: 10,
      xpReward: 5,
      content: [{ type: "text", content: titleEn }],
      contentMm: null,
      mmContentReady: false,
      isPublished: true,
      quizQuestions: null,
      quizQuestionsMm: null,
      furtherReadingUrl: null,
      furtherReadingLabel: null,
      hookTextMm: null,
      keyTakeawayMm: null,
      commonMistakeMm: null,
      actionStepsMm: null,
      decisionScenarioMm: null,
    },
  };
}

function hangingFetch(pending: Pending[]) {
  return ((input: string | URL | Request) =>
    new Promise<Response>((resolve) => {
      pending.push({ url: String(input), resolve });
    })) as typeof fetch;
}

function abortAwareHang() {
  return ((input: string | URL | Request, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      const fail = () => {
        const err = new Error("aborted");
        err.name = "AbortError";
        reject(err);
      };
      if (init?.signal?.aborted) fail();
      else init?.signal?.addEventListener("abort", fail, { once: true });
    })) as typeof fetch;
}

async function seedJobs(): Promise<void> {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify(jobPayload("seed")), { status: 200 })) as typeof fetch;
  try {
    await loadJobs();
  } finally {
    globalThis.fetch = original;
    resetGenerations();
  }
}

async function seedAcademy(): Promise<void> {
  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(academyPayload("seed")), { status: 200 })) as typeof fetch;
  try {
    await loadAcademy();
  } finally {
    globalThis.fetch = original;
    resetGenerations();
  }
}

test("jobs: older A cannot overwrite newer B", async (t) => {
  resetMemoryKv();
  resetGenerations();
  const pending: Pending[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = hangingFetch(pending);
  t.after(() => {
    globalThis.fetch = original;
    resetMemoryKv();
    resetGenerations();
  });

  const a = loadJobs();
  const b = loadJobs();
  await Promise.resolve();
  const reqA = pending[0]!;
  const reqB = pending[1]!;
  reqB.resolve(new Response(JSON.stringify(jobPayload("newer")), { status: 200 }));
  const bResult = await b;
  assert.equal(bResult.jobs[0]?.id, "newer");
  assert.equal(catalog.snapshot().jobs[0]?.id, "newer");
  reqA.resolve(new Response(JSON.stringify(jobPayload("older")), { status: 200 }));
  const aResult = await a;
  assert.equal(catalog.snapshot().jobs[0]?.id, "newer");
  assert.equal(aResult.jobs[0]?.id, "newer");
});

test("academy: older A cannot overwrite newer B", async (t) => {
  resetMemoryKv();
  resetGenerations();
  const pending: Pending[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = hangingFetch(pending);
  t.after(() => {
    globalThis.fetch = original;
    resetMemoryKv();
    resetGenerations();
  });

  const a = loadAcademy();
  const b = loadAcademy();
  await Promise.resolve();
  pending[1]!.resolve(new Response(JSON.stringify(academyPayload("newer")), { status: 200 }));
  await b;
  assert.equal(catalog.snapshot().modules[0]?.id, "newer");
  pending[0]!.resolve(new Response(JSON.stringify(academyPayload("older")), { status: 200 }));
  const aResult = await a;
  assert.equal(catalog.snapshot().modules[0]?.id, "newer");
  assert.equal(aResult.modules[0]?.id, "newer");
});

test("jobs: B fails then A succeeds and A is cached", async (t) => {
  resetMemoryKv();
  resetGenerations();
  await seedJobs();
  assert.equal(catalog.snapshot().jobs[0]?.id, "seed");
  const pending: Pending[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = hangingFetch(pending);
  t.after(() => {
    globalThis.fetch = original;
    resetMemoryKv();
    resetGenerations();
  });

  const a = loadJobs();
  const b = loadJobs();
  await Promise.resolve();
  pending[1]!.resolve(new Response("down", { status: 500 }));
  const bResult = await b;
  assert.equal(bResult.fromCache, true);
  assert.equal(bResult.jobs[0]?.id, "seed");
  assert.equal(catalog.snapshot().jobs[0]?.id, "seed");
  pending[0]!.resolve(new Response(JSON.stringify(jobPayload("valid-older")), { status: 200 }));
  const aResult = await a;
  assert.equal(aResult.fromCache, false);
  assert.equal(aResult.jobs[0]?.id, "valid-older");
  assert.equal(catalog.snapshot().jobs[0]?.id, "valid-older");
});

test("academy: B fails then A succeeds and A is cached", async (t) => {
  resetMemoryKv();
  resetGenerations();
  await seedAcademy();
  assert.equal(catalog.snapshot().modules[0]?.id, "seed");
  const pending: Pending[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = hangingFetch(pending);
  t.after(() => {
    globalThis.fetch = original;
    resetMemoryKv();
    resetGenerations();
  });

  const a = loadAcademy();
  const b = loadAcademy();
  await Promise.resolve();
  pending[1]!.resolve(new Response("down", { status: 500 }));
  const bResult = await b;
  assert.equal(bResult.fromCache, true);
  assert.equal(bResult.modules[0]?.id, "seed");
  pending[0]!.resolve(new Response(JSON.stringify(academyPayload("valid-older")), { status: 200 }));
  const aResult = await a;
  assert.equal(aResult.fromCache, false);
  assert.equal(aResult.modules[0]?.id, "valid-older");
  assert.equal(catalog.snapshot().modules[0]?.id, "valid-older");
});

test("concurrent module X and Y responses both remain cached", async (t) => {
  resetMemoryKv();
  resetGenerations();
  const pending: Pending[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = hangingFetch(pending);
  t.after(() => {
    globalThis.fetch = original;
    resetMemoryKv();
    resetGenerations();
  });

  const x = loadModule("mod-x");
  const y = loadModule("mod-y");
  await Promise.resolve();
  pending[1]!.resolve(new Response(JSON.stringify(modulePayload("mod-y")), { status: 200 }));
  const yResult = await y;
  assert.equal(yResult.id, "mod-y");
  assert.equal(catalog.findModuleBody("mod-y")?.id, "mod-y");
  pending[0]!.resolve(new Response(JSON.stringify(modulePayload("mod-x")), { status: 200 }));
  const xResult = await x;
  assert.equal(xResult.id, "mod-x");
  assert.equal(catalog.findModuleBody("mod-x")?.id, "mod-x");
  assert.equal(catalog.findModuleBody("mod-y")?.id, "mod-y");
});

test("same-module newer success still defeats older completion", async (t) => {
  resetMemoryKv();
  resetGenerations();
  const pending: Pending[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = hangingFetch(pending);
  t.after(() => {
    globalThis.fetch = original;
    resetMemoryKv();
    resetGenerations();
  });

  const a = loadModule("mod-x");
  const b = loadModule("mod-x");
  await Promise.resolve();
  pending[1]!.resolve(new Response(JSON.stringify(modulePayload("mod-x", "newer")), { status: 200 }));
  await b;
  assert.equal(catalog.findModuleBody("mod-x")?.titleEn, "newer");
  pending[0]!.resolve(new Response(JSON.stringify(modulePayload("mod-x", "older")), { status: 200 }));
  const aResult = await a;
  assert.equal(aResult.titleEn, "newer");
  assert.equal(catalog.findModuleBody("mod-x")?.titleEn, "newer");
});

test("aborted jobs request does not persist", async (t) => {
  resetMemoryKv();
  resetGenerations();
  const original = globalThis.fetch;
  globalThis.fetch = abortAwareHang();
  t.after(() => {
    globalThis.fetch = original;
    resetMemoryKv();
    resetGenerations();
  });
  const controller = new AbortController();
  const pending = loadJobs(controller.signal);
  controller.abort();
  await assert.rejects(pending);
  assert.equal(catalog.snapshot().jobs.length, 0);
});

test("aborted academy request does not persist", async (t) => {
  resetMemoryKv();
  resetGenerations();
  const original = globalThis.fetch;
  globalThis.fetch = abortAwareHang();
  t.after(() => {
    globalThis.fetch = original;
    resetMemoryKv();
    resetGenerations();
  });
  const controller = new AbortController();
  const pending = loadAcademy(controller.signal);
  controller.abort();
  await assert.rejects(pending);
  assert.equal(catalog.snapshot().modules.length, 0);
});
