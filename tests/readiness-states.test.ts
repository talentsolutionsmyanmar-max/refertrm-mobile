import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import { staleContentBanner } from "../src/api/catalogue-presentation";
import { errorMessage } from "../src/copy/error";
import { TimeoutError, TransportError, createRequestSignal } from "../src/api/signal";

test("staleContentBanner only shows when there is content and the source is stale", () => {
  assert.equal(
    staleContentBanner({ hasContent: false, fromCache: true, isError: false, online: true }),
    null,
  );
  assert.equal(
    staleContentBanner({ hasContent: true, fromCache: false, isError: false, online: true }),
    null,
  );
  assert.match(
    staleContentBanner({ hasContent: true, fromCache: true, isError: false, online: true }) ?? "",
    /Saved content/,
  );
  assert.match(
    staleContentBanner({ hasContent: true, fromCache: false, isError: false, online: false }) ?? "",
    /offline/i,
  );
});

test("errorMessage maps transport and timeout failures without throwing", () => {
  assert.match(errorMessage(new TimeoutError()), /longer than expected/i);
  assert.match(errorMessage(new TransportError()), /cannot connect/i);
  assert.match(errorMessage(new Error("refertrm_503")), /Something went wrong/i);
});

test("createRequestSignal surfaces timeout without hanging", async () => {
  const managed = createRequestSignal(undefined, 40);
  await new Promise<void>((resolve, reject) => {
    managed.signal.addEventListener(
      "abort",
      () => {
        try {
          assert.equal(managed.timedOut(), true);
          resolve();
        } catch (error) {
          reject(error);
        }
      },
      { once: true },
    );
  });
  managed.cleanup();
});

for (const [screen, file] of [
  ["job detail", "app/jobs/[id].tsx"],
  ["lesson", "app/learn/[slug].tsx"],
] as const) {
  test(`${screen} wires offline banner, retry, and online hook`, () => {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.match(source, /staleContentBanner/);
    assert.match(source, /useOnline/);
    assert.match(source, /RetryState/);
    assert.match(source, /copy\.errors\.retry/);
    assert.match(source, /errorMessage/);
  });
}

test("root layout connects NetInfo to React Query onlineManager", () => {
  const layout = readFileSync(new URL("../app/_layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /onlineManager\.setEventListener/);
  assert.match(layout, /@react-native-community\/netinfo/);
  const queryClient = readFileSync(new URL("../src/query/client.ts", import.meta.url), "utf8");
  assert.match(queryClient, /networkMode:\s*"offlineFirst"/);
  assert.match(layout, /createAppQueryClient/);
});
