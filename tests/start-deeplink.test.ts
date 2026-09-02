import assert from "node:assert/strict";
import { parseDeepLink } from "../src/linking/paths.ts";

const startUrls = [
  "https://www.refertrm.com/start",
  "https://refertrm.com/start",
  "refertrm://start",
];

const notStartUrls = [
  "https://www.refertrm.com/start/",
  "https://www.refertrm.com/jobs/",
  "https://www.refertrm.com/learn/",
  "https://www.refertrm.com/academy/",
  "refertrm://evil/start",
  "refertrm://start/",
  "refertrm://other",
  "refertrm://start/extra",
];

for (const url of startUrls) {
  assert.equal(parseDeepLink(url).type, "start", `${url} must parse as start`);
}

for (const url of notStartUrls) {
  assert.notEqual(parseDeepLink(url).type, "start", `${url} must not parse as start`);
}

console.log("start-deeplink PASS");
