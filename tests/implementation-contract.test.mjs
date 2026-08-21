import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeSource = await readFile(new URL("../app/api/data/route.ts", import.meta.url), "utf8");
const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const schemaSource = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
const databaseSource = await readFile(new URL("../db/index.ts", import.meta.url), "utf8");

test("ordinary company edits do not append investment snapshots", () => {
  const updateCompany = routeSource.slice(routeSource.indexOf('action === "update_company"'), routeSource.indexOf('action === "create_task"'));
  assert.doesNotMatch(updateCompany, /investmentSnapshots/);
  assert.match(routeSource, /action === "create_snapshot"/);
});

test("sync status exposes failed and offline persistence states", () => {
  assert.match(pageSource, /setSyncStatus\([^)]*"failed"/);
  assert.match(pageSource, /setSyncStatus\([^)]*"offline"/);
  assert.match(pageSource, /label: "保存失败"/);
});

test("financial provenance metadata is present in the schema and API", () => {
  assert.match(schemaSource, /unitScale: integer\("unit_scale"\)/);
  assert.match(schemaSource, /sourceDocumentId: integer\("source_document_id"\)/);
  assert.match(schemaSource, /export const sourceDocuments/);
  assert.match(routeSource, /action === "create_source_document"/);
  assert.match(pageSource, /sourceDocumentId/);
  assert.match(pageSource, /source\.title/);
  assert.match(databaseSource, /row\.isSample === 1/);
});
