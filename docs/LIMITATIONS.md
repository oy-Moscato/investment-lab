# Known limitations and audit notes

This list is intentionally candid. It records behavior visible in the current
source rather than proposing a replacement implementation.

## Product and data limitations

- Prices and company market data are manually maintained. There is no market
  data provider, delayed quote service, corporate-action handling, FX layer, or
  broker connection.
- The built-in financial histories are illustrative five-year seed rows. The
  UI does not yet provide a financial statement editor, CSV import, or source
  citation per financial number.
- Portfolio cash is displayed as `未设置`; country concentration, market-cap
  style, realized-return presentation, and thesis exposure are not complete.
- There is no `watchlist` entity: status on `companies` acts as the watchlist.
- There is no prediction/calibration system, AI search over history, or
  hidden-correlation/thesis-exposure model.
- DCF has a five-year explicit forecast and terminal value, but no growth ×
  margin sensitivity grid or automatic variable-sensitivity ranking.

## CRUD and data integrity limitations

- The API has one general POST dispatcher rather than typed route modules.
- Only tasks have a real delete action. Companies, transactions, journal rows,
  snapshots, observations, evidence, events, industries, and valuations do not
  have complete edit/delete workflows.
- Journal entries, transactions, snapshots, observations, and evidence are
  append-only in the current API; this is intentional for historical memory but
  there is no correction/reversal workflow.
- The database schema has no SQL foreign keys or cascade rules. Orphaned IDs are
  possible if data is written outside the UI.
- Validation is basic string/number validation in `app/api/data/route.ts`; there
  is no shared schema validator, authorization middleware, rate limiting, or
  audit-user column.

## Authentication and privacy limitations

- `app/chatgpt-auth.ts` provides helper functions but the current page and API
  do not use them. The deployed Site is safe only because its Sites access
  policy is Owner-only. Do not make this endpoint public without adding
  application-level authorization and user scoping.
- The public repository intentionally excludes production D1 rows. A clone
  initializes demo data when its database tables are empty.
- The source snapshot replaces the production UI avatar initials with the
  neutral `IL` mark; this is the only UI-personalization sanitization applied.

## UI truthfulness checks

- The Dashboard task check button is rendered but does not attach a completion
  handler; task completion works from the Research Queue view.
- The top-bar search icon is a visual affordance without a handler. Search in
  the Company Research list is the working search surface.
- Some labels describe the target product vision more broadly than the current
  implementation. The feature matrix is the source of truth for audit status.

## Engineering shape

- Most frontend views live in a single roughly 205-line `app/page.tsx` file
  with dense JSX and local types. The code is functional but not yet
  decomposed into feature folders, hooks, services, or a shared type package.
- `ensureDatabase()` runs schema/bootstrap checks on every API request. This is
  convenient for an early Site but should be separated into a controlled
  migration/seed process as data volume grows.
- The production source contains the Sites project identifier in
  `.openai/hosting.json`. It is not a credential, but a future public deploy
  should use a separate project/database to avoid accidental production writes.

## Not included in this repository

- No production database export, private research notes, real positions, costs,
  transactions, journals, account identifiers, or screenshots containing user
  data.
- No secrets, bearer tokens, cookies, password material, or private keys.
- No new production changes were made as part of this export.


## P1 Issue #3 boundaries

# Current Limitations

This file describes known boundaries of the current Investment Lab Sites
implementation. It is not a substitute for the Roadmap Issues.

- Financial sources are represented by metadata, URLs, and notes; the app does
  not yet upload or extract PDF content.
- Source edits update the current document row. A full append-only audit trail
  for source edits is not implemented yet.
- CSV import is structured-data import. It does not automatically detect
  currency, unit scale, fiscal calendars, or accounting restatements.
- The CSV importer accepts a company ticker or company ID; ambiguous tickers are
  not an external-market lookup.
- Source and financial record integrity is enforced in application code while
  SQL foreign keys remain deferred.
- The current Site is owner/private and the data route is not a multi-user,
  row-scoped backend.
- No production checkpoint or deployment was performed for this work.

