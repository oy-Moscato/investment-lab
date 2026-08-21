# Work Implementation P0

This document is the code-level handoff for the second-round review of the
Investment Lab Sites implementation.

## Snapshot identity

- Current Sites source branch: `review/p0-accepted`
- Current Sites source commit: `9904d25`
- First-round correctness commit: `583d018`
- Second-round test/guard commit: `7a1e28d`
- This public audit branch: `work/p0-accepted-audit`
- Production Site: unchanged; no production checkpoint or deployment was run.

The public branch contains source code and demo seed definitions only. It does
not contain production D1 rows, private notes, real positions, real trades,
account identifiers, or secrets.

## Schema additions

The implementation adds the following persisted metadata:

- `companies.currency`: reporting/trading currency for a company.
- `financials.currency`: reporting currency for each financial row.
- `financials.unit_scale`: scale such as units, thousands, millions, or billions.
- `financials.source_document_id`: logical link to the source document used for
  the row.
- `transactions.currency`: historical currency captured at transaction write
  time.
- `transactions.fx_rate_to_base`: optional manually entered conversion rate.
- `transactions.reversal_of_transaction_id`: optional reference for a future
  append-only correction workflow.
- `source_documents`: title, URL, filing/period dates, currency, unit scale,
  verification flag, and logical company association.
- `app_settings`: key/value settings; currently used for `base_currency` and
  one-time migration markers.

The schema intentionally has no SQL foreign-key constraints in this batch.
Application-level company existence and transaction validation are present;
safe D1 table-rebuild planning is deferred.

## Migration and initialization order

`ensureDatabase()` in `db/index.ts` is called before both API reads and writes.
It performs these idempotent steps:

1. Run the existing `CREATE TABLE IF NOT EXISTS` and index statements.
2. Create `source_documents` and `app_settings` if absent.
3. Add missing currency, unit-scale, provenance, FX, reversal, and snapshot
   metric columns with `ALTER TABLE ... ADD COLUMN` checks based on
   `PRAGMA table_info`.
4. Run `currency_migration_v1` once. Existing newly-added financial and
   transaction currency fields are backfilled from the associated company
   currency; the marker is stored in `app_settings`.
5. Insert `base_currency=USD` only when that setting is absent.
6. Run `unit_scale_migration_v1` once for built-in sample financial rows,
   setting their illustrative reporting scale to millions.
7. Insert demo source documents only when the source-document table is empty
   and only for rows marked `is_sample=1`. Existing production rows are not
   exported and are not replaced by this public snapshot.
8. Seed the remaining demo collections only when their individual table is
   empty. Seeded rows are explicitly demo data.
9. Backfill seeded valuation share counts from the latest financial row when a
   seeded scenario has a placeholder share count.

The migration statements are visible in:

- `db/index.ts` — runtime bootstrap and compatibility checks
- `drizzle/0003_flippant_iron_lad.sql` — generated additive migration
- `database/schema.sql` — review-friendly effective schema mirror

## Preservation and historical semantics

- Existing D1 rows are not exported or rewritten by the public repository.
- The company edit API updates only the mutable `companies` row. It does not
  update historical transaction currency fields or append an investment
  snapshot.
- A transaction is inserted with its own currency, optional FX rate, and
  optional reversal reference. The API never updates prior transaction rows.
- If transaction currency history does not match the current company currency,
  the derived position is marked `MIXED` and its base-currency totals remain
  unavailable instead of silently relabeling or aggregating incompatible
  amounts.
- Ordinary company metadata edits therefore do not create memory history;
  explicit `create_snapshot` actions remain append-only.

## Validation and calculation changes

- A transaction must reference an existing company, use `buy` or `sell`, have
  positive shares, and have a non-negative price.
- A sell is rejected when it exceeds the append-only share ledger. Buy 10 →
  sell 4 → sell 6 is valid; fees do not change share count.
- DCF uses the change in NWC balance (`current NWC - prior NWC`) and rejects
  terminal growth greater than or equal to WACC, unreasonable WACC, and
  non-positive shares.
- The current relative valuation denominator is operating income, so the UI
  labels it `EV / EBIT`; no EBITDA field is fabricated.
- Financial rows display reporting currency, unit scale, and source-document
  title when provenance is present.
- The UI exposes `saving`, `云端已同步`, `保存失败`, and `离线模式` based on
  actual API request state.

## Verification added for this handoff

- `tests/financial-correctness.test.mjs` covers DCF guards, `ΔNWC`, share
  ledger behavior, transaction validation, missing-FX non-aggregation, and
  historical currency mismatch handling.
- `tests/implementation-contract.test.mjs` covers no-snapshot ordinary company
  edits, explicit snapshot route presence, sync failure/offline states,
  provenance fields/source title, and sample-only demo provenance seeding.
- `tests/rendered-html.test.mjs` verifies the built page marker.

The source-contract tests are intentionally separate from an integration test
against production D1. They make the reviewable implementation guarantees
visible without connecting this public repository to private data.

## Known limitations remaining

- No automatic FX-rate provider; FX remains optional/manual.
- No full source-document editor or historical provenance backfill UI.
- No SQL foreign-key enforcement or cascade migration.
- No valuation sensitivity matrix, thesis-exposure aggregation, prediction
  calibration, AI history search, tags, cash-account model, or broker link.
- API authorization remains an access-policy concern: the current Site is
  private/Owner-only, while the route itself is not user-row scoped.
