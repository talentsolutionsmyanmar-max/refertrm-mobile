import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import { cataloguePresentation } from "../src/api/catalogue-presentation";

const fresh = { count: 2, hasData: true, fromCache: false, isError: false, online: true };

test("counts distinguish successful empty data from absent or failed data", () => {
  assert.equal(cataloguePresentation(fresh).showCount, true);
  assert.equal(cataloguePresentation({ ...fresh, count: 0 }).showCount, true);
  assert.equal(cataloguePresentation({ ...fresh, count: 0, hasData: false }).showCount, false);
  assert.equal(cataloguePresentation({ ...fresh, count: 0, isError: true }).showCount, false);
  assert.equal(cataloguePresentation({ ...fresh, count: 0, fromCache: true }).showCount, false);
  assert.equal(cataloguePresentation({ ...fresh, count: 0, online: false }).showCount, false);
});

test("usable data survives a failed refresh but is explicitly stale", () => {
  for (const changed of [{ fromCache: true }, { isError: true }, { online: false }]) {
    const result = cataloguePresentation({ ...fresh, ...changed });
    assert.equal(result.showCount, true);
    assert.equal(result.stale, true);
  }
  assert.equal(cataloguePresentation(fresh).stale, false);
});

test("a live empty catalogue is not an offline message; filtered usable data stays search-empty", () => {
  assert.equal(cataloguePresentation({ ...fresh, count: 0 }).emptyOffline, false);
  assert.equal(cataloguePresentation({ ...fresh, count: 0, online: false }).emptyOffline, true);
  assert.equal(cataloguePresentation({ ...fresh, online: false }).emptyOffline, false);
});

for (const [file, rows, section] of [["jobs", "jobs", "jobs"], ["learn", "modules", "academy"]]) {
  test(`${file} screen consumes the shared state and gates its catalogue count`, () => {
    const source = readFileSync(new URL(`../app/(tabs)/${file}.tsx`, import.meta.url), "utf8");
    assert.match(source, /import \{ cataloguePresentation \} from "\.\.\/\.\.\/src\/api\/catalogue-presentation"/);
    assert.ok(source.includes(`count: ${rows}.length`));
    for (const input of ["hasData: query.data !== undefined", "fromCache: Boolean(query.data?.fromCache)", "isError: query.isError", "online,"]) {
      assert.ok(source.includes(input), `missing state input: ${input}`);
    }
    assert.match(source, /\{presentation\.showCount \? \(\s*<Text[^>]*>/);
    assert.ok(source.includes(`{copy.${section}.count(${rows}.length)}`));
    assert.ok(source.includes(`presentation.emptyOffline ? copy.${section}.emptyOffline : copy.${section}.empty`));
    assert.ok(source.includes(`presentation.stale && ${rows}.length > 0`));
    assert.ok(source.includes(`${rows}.length === 0 && query.isError`));
  });
}
