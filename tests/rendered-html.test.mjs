import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("renders Investment Lab metadata", async () => {
  const builtServer = await readFile(new URL("../dist/server/index.js", import.meta.url), "utf8");
  assert.match(builtServer, /Investment Lab \| 长期投资研究工作台/);
  assert.match(builtServer, /长期投资研究工作台/);
});
