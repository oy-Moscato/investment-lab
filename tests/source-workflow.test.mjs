import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { FINANCIAL_IMPORT_EXAMPLE, parseFinancialCsv } from "../lib/financial-provenance.js";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("financial CSV parser preserves provenance metadata and numeric fields", () => {
  const parsed = parseFinancialCsv(FINANCIAL_IMPORT_EXAMPLE);
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].ticker, "NVDA");
  assert.equal(parsed.rows[0].currency, "USD");
  assert.equal(parsed.rows[0].unitScale, "millions");
  assert.equal(parsed.rows[0].dataStatus, "reported");
  assert.equal(parsed.rows[0].revenue, 130497);
  assert.equal(parsed.rows[0].sourceDocumentId, 1);
});

test("financial CSV parser rejects missing identity, year, and invalid status", () => {
  const parsed = parseFinancialCsv("ticker,year,dataStatus\n,0,unknown");
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.errors.length, 3);
});

test("source workflow has additive schema, CRUD actions, and explicit import overwrite mode", () => {
  const schema = read("db/schema.ts");
  const route = read("server/data-service.ts");
  const migration = read("drizzle/0003_secret_mister_fear.sql");
  assert.match(schema, /sourceDocuments = sqliteTable/);
  assert.match(schema, /sourceDocumentId: integer\("source_document_id"\)/);
  assert.match(schema, /dataStatus: text\("data_status"\)/);
  assert.match(route, /create_source_document/);
  assert.match(route, /update_source_document/);
  assert.match(route, /delete_source_document/);
  assert.match(route, /create_financial/);
  assert.match(route, /update_financial/);
  assert.match(route, /import_financial_csv/);
  assert.match(route, /mode === "insert"/);
  assert.match(route, /status: 409/);
  assert.match(migration, /CREATE TABLE `source_documents`/);
  assert.match(migration, /ALTER TABLE `financials` ADD `source_document_id`/);
});

test('CSV invalid numbers, unclosed quotes and duplicate headers are rejected', () => {
  for (const text of ['ticker,year,revenue\nTEST,2025,nonsense', 'ticker,year\n"TEST,2025', 'ticker,year,year\nTEST,2025,2026']) {
    assert.ok(parseFinancialCsv(text).errors.length > 0);
  }
});

test('absent financial columns remain absent for partial explicit updates', () => {
  const parsed = parseFinancialCsv('ticker,year,revenue\nTEST,2025,100');
  assert.equal(parsed.rows[0].revenue, 100);
  assert.equal(Object.hasOwn(parsed.rows[0], 'debt'), false);
});
