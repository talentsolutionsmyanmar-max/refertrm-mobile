import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = new Map<string, string>();
const INSTALL_FILE_URI = "file:///mixpanel-test/refertrm.mixpanel.install-id.v1.txt";

mock.module("expo-file-system/legacy", {
  namedExports: {
    documentDirectory: "file:///mixpanel-test/",
    getInfoAsync: async (uri: string) => ({ exists: files.has(uri) }),
    readAsStringAsync: async (uri: string) => {
      const value = files.get(uri);
      if (value === undefined) throw new Error("missing test file");
      return value;
    },
    writeAsStringAsync: async (uri: string, value: string) => {
      files.set(uri, value);
    },
    deleteAsync: async (uri: string) => {
      files.delete(uri);
    },
  },
});

const originalToken = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
const originalFetch = globalThis.fetch;

let resetMemoryKv: typeof import("../src/storage/kv").resetMemoryKv;
let resetInstallIdForTests: typeof import("../src/analytics/identity").resetInstallIdForTests;

beforeEach(async () => {
  const kvApi = await import("../src/storage/kv");
  const identityApi = await import("../src/analytics/identity");
  resetMemoryKv = kvApi.resetMemoryKv;
  resetInstallIdForTests = identityApi.resetInstallIdForTests;
  delete process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
  resetMemoryKv();
  resetInstallIdForTests();
  files.clear();
  globalThis.fetch = async () => new Response("1", { status: 200 });
});

afterEach(() => {
  if (originalToken === undefined) delete process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
  else process.env.EXPO_PUBLIC_MIXPANEL_TOKEN = originalToken;
  globalThis.fetch = originalFetch;
});

test("does not fetch when EXPO_PUBLIC_MIXPANEL_TOKEN is unset", async () => {
  const { captureProductEvent } = await import("../src/analytics/client");
  let called = 0;
  globalThis.fetch = async () => {
    called += 1;
    return new Response("1", { status: 200 });
  };
  captureProductEvent("login_success", { method: "email", email: "ada@example.com" });
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(called, 0);
});

test("posts mapped events to Mixpanel HTTP and strips PII", async () => {
  process.env.EXPO_PUBLIC_MIXPANEL_TOKEN = "mp_android_token";
  const { captureProductEvent } = await import("../src/analytics/client");

  let url = "";
  let init: RequestInit | undefined;
  globalThis.fetch = async (input, options) => {
    url = String(input);
    init = options;
    return new Response(JSON.stringify({ status: 1 }), { status: 200 });
  };

  captureProductEvent("academy_lesson_started", {
    module_id: "mod-9",
    title: "Salary basics",
    email: "ada@example.com",
    page_path: "/learn/salary-basics",
  });

  await new Promise((r) => setTimeout(r, 40));
  assert.equal(url.startsWith("https://api.mixpanel.com/track"), true);
  assert.equal(init?.method, "POST");
  const body = JSON.parse(String(init?.body)) as Array<{
    event: string;
    properties: Record<string, unknown>;
  }>;
  assert.equal(body.length, 1);
  assert.equal(body[0].event, "academy_lesson_started");
  assert.equal(body[0].properties.lesson_id, "mod-9");
  assert.equal(body[0].properties.module_id, "mod-9");
  assert.equal(body[0].properties.token, "mp_android_token");
  assert.equal(typeof body[0].properties.distinct_id, "string");
  assert.ok(String(body[0].properties.distinct_id).length > 4);
  assert.equal(body[0].properties.platform, "android");
  assert.equal(body[0].properties.app_version, "1.0.0");
  assert.equal(body[0].properties.$source, "refertrm-android");
  const serialized = JSON.stringify(body);
  assert.equal(serialized.includes("ada@example.com"), false);
  assert.equal(serialized.includes("Salary basics"), false);
});

test("does not send uncatalogued events", async () => {
  process.env.EXPO_PUBLIC_MIXPANEL_TOKEN = "mp_android_token";
  const { captureProductEvent } = await import("../src/analytics/client");
  let called = 0;
  globalThis.fetch = async () => {
    called += 1;
    return new Response("1", { status: 200 });
  };
  captureProductEvent("game_started");
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(called, 0);
});

test("search helper never includes query text", async () => {
  process.env.EXPO_PUBLIC_MIXPANEL_TOKEN = "mp_android_token";
  const { trackAcademySearchUsed } = await import("../src/analytics/client");
  let init: RequestInit | undefined;
  globalThis.fetch = async (_input, options) => {
    init = options;
    return new Response("1", { status: 200 });
  };
  trackAcademySearchUsed("learn_catalog", "accountant yangon", 3);
  await new Promise((r) => setTimeout(r, 40));
  const body = JSON.parse(String(init?.body)) as Array<{
    event: string;
    properties: Record<string, unknown>;
  }>;
  assert.equal(body[0].event, "academy_search_used");
  assert.equal(body[0].properties.surface, "learn_catalog");
  assert.equal(body[0].properties.query_length, "accountant yangon".length);
  assert.equal(body[0].properties.result_count, 3);
  assert.equal("query" in body[0].properties, false);
  assert.equal(JSON.stringify(body).includes("accountant"), false);
});

test("empty search is a no-op", async () => {
  process.env.EXPO_PUBLIC_MIXPANEL_TOKEN = "mp_android_token";
  const { trackAcademySearchUsed } = await import("../src/analytics/client");
  let called = 0;
  globalThis.fetch = async () => {
    called += 1;
    return new Response("1", { status: 200 });
  };
  trackAcademySearchUsed("learn_catalog", "   ");
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(called, 0);
});

test("failed Mixpanel POST does not throw", async () => {
  process.env.EXPO_PUBLIC_MIXPANEL_TOKEN = "mp_android_token";
  const { captureProductEvent } = await import("../src/analytics/client");
  globalThis.fetch = async () => {
    throw new Error("network request failed");
  };
  assert.doesNotThrow(() => captureProductEvent("job_viewed", { job_id: "job-1" }));
  await new Promise((r) => setTimeout(r, 40));
});

test("token helper rejects short or secret-shaped values", async () => {
  const { getMixpanelToken } = await import("../src/analytics/token");
  process.env.EXPO_PUBLIC_MIXPANEL_TOKEN = "short";
  assert.equal(getMixpanelToken(), null);
  process.env.EXPO_PUBLIC_MIXPANEL_TOKEN = "mp_android_token";
  assert.equal(getMixpanelToken(), "mp_android_token");
});

test("events await disk hydration and reuse the persisted install id", async () => {
  process.env.EXPO_PUBLIC_MIXPANEL_TOKEN = "mp_android_token";
  files.set(INSTALL_FILE_URI, "persisted-install-id");
  resetMemoryKv();
  resetInstallIdForTests();
  const { captureProductEvent } = await import("../src/analytics/client");
  const bodies: Array<{ properties: Record<string, unknown> }> = [];
  globalThis.fetch = async (_input, options) => {
    bodies.push(JSON.parse(String(options?.body))[0]);
    return new Response("1", { status: 200 });
  };
  captureProductEvent("app_opened");
  captureProductEvent("job_viewed", { job_id: "job-1" });
  await new Promise((r) => setTimeout(r, 80));
  assert.equal(bodies.length, 2);
  assert.equal(bodies[0].properties.distinct_id, "persisted-install-id");
  assert.equal(bodies[1].properties.distinct_id, "persisted-install-id");
});

test("client posts directly to Mixpanel HTTP and does not ship an SDK", () => {
  const src = readFileSync(join(root, "src/analytics/client.ts"), "utf8");
  assert.ok(src.includes("https://api.mixpanel.com/track"));
  assert.equal(src.includes("mixpanel-react-native"), false);
  assert.equal(src.includes("mixpanel-browser"), false);
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
    dependencies: Record<string, string>;
  };
  assert.equal("mixpanel-react-native" in pkg.dependencies, false);
});
