# Work Implementation P1-3

## Scope

This document records the implementation of GitHub Issue #3: complete financial
source editing, historical backfill, and CSV import workflow.

- Base Sites source: `6888042 Add investment memory first phase`
- Working branch: `work/p1-source-workflow`
- Production deployment: none
- Production D1 mutation: none during source implementation and Preview QA

## What changed

### Data model

- Added `source_documents` with company, title, source type, URL, filing date,
  covered period, currency, unit scale, notes, and `is_sample` provenance.
- Added `currency` to `companies`.
- Added `period_end`, `filing_date`, `currency`, `unit_scale`, `data_status`,
  `source_document_id`, and `audit_note` to `financials`.
- Added an index for financial rows by source document.
- Generated `drizzle/0003_secret_mister_fear.sql`.

### Compatibility and preservation

`ensureDatabase()` keeps the existing create-if-missing bootstrap and adds
missing columns with idempotent `PRAGMA table_info` checks. Existing financial
rows are not deleted or rewritten as user data.

Only rows belonging to built-in `is_sample = 1` companies receive seeded
`DEMO DATA` source documents. Real rows are not assigned invented documents.
Sample financial rows are marked `estimate`, use the seeded source's currency
and unit scale, and carry an explicit demo audit note.

### API actions

- `create_source_document`
- `update_source_document`
- `delete_source_document`
- `create_financial`
- `update_financial`
- `delete_financial`
- `import_financial_csv`

Source binding is checked at the application layer. A source document cannot be
deleted while a financial row still references it. A financial row cannot bind
to a source from another company.

CSV import is two-phase at the UI level: parse/preview first, then submit. The
default `insert` mode rejects any existing company-year conflict with HTTP 409.
The `upsert` mode is explicit and is the only mode allowed to update existing
years.

## Preview verification

- Source & Backfill navigation loads successfully.
- ASML demo source displays `DEMO DATA`, `EUR`, and `millions`.
- Five historical financial years display their bound source document.
- New source editor opens with title, period, currency, unit, URL, and notes.
- CSV paste produces a preview without writing data.
- Switching import strategy visibly changes from reject-on-conflict to explicit
  update mode.
- Preview console contained only unrelated browser-extension metadata noise.

## Tests

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed: build plus 4 tests.
- `tests/source-workflow.test.mjs` covers CSV metadata parsing, invalid-row
  rejection, schema/API actions, migration presence, and explicit overwrite
  protection.

## Known boundaries

- The current source editor stores URLs and notes; it does not upload or parse
  PDFs directly.
- Source history currently relies on `updated_at` and notes. A full append-only
  source-edit audit table remains future work.
- CSV import accepts structured financial values but does not infer accounting
  units or currency from the file contents.
- Foreign keys remain deferred; cross-entity integrity is checked in the API.
- The existing Site source remains owner/private and this branch was not
  checkpointed or deployed.
