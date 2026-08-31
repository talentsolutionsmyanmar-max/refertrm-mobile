import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { START_URL, openStartBridge } from "../src/linking/start.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("the native platform bridge uses the canonical ReferTRM start gateway", async () => {
  const opened: string[] = [];

  await openStartBridge(async (url) => {
    opened.push(url);
  });

  assert.equal(START_URL, "https://www.refertrm.com/start");
  assert.deepEqual(opened, ["https://www.refertrm.com/start"]);
});

test("bridge launch errors remain visible to the caller", async () => {
  await assert.rejects(
    openStartBridge(async () => {
      throw new Error("browser_unavailable");
    }),
    /browser_unavailable/,
  );
});

test("Home visibly exposes the canonical Start bridge", () => {
  const home = readFileSync(join(root, "app/(tabs)/home.tsx"), "utf8");
  assert.equal(home.includes("openStartBridge"), true);
  assert.equal(home.includes("Open ReferTRM Start"), true);
  assert.equal(home.includes("/landing"), false);
});
