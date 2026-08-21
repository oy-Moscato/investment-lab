# Database model

The current database is a D1/SQLite schema accessed through Drizzle. The
authoritative TypeScript definitions are in `db/schema.ts`; the SQL mirror for
review is `database/schema.sql`.

## Entity map

```text
Company (companies)
├── Financial rows (financials)
├── Transactions (transactions) → derived positions / portfolio metrics
├── Source documents (source_documents) → financial provenance
├── Valuation scenarios (valuations)
├── Investment snapshots (investment_snapshots)
├── Assumptions (assumptions) → observation history (assumption_observations)
├── Evidence items (evidence)
├── Journal entries (journal)
├── Research tasks (tasks)
└── Upcoming events (events)

Industry knowledge (industries) and screener templates (screener_templates)
are standalone collections. `app_settings` stores base currency and
idempotency markers.
```

## Tables currently present

| Table | Role | Relationship notes |
| --- | --- | --- |
| `companies` | Current company research record | Root entity for most company-linked rows; `is_sample` marks demo companies. |
| `financials` | One row per company/year | Logical `company_id`; unique index on `(company_id, year)`; reporting currency, unit scale, and optional source document. |
| `transactions` | Append-only buy/sell ledger | Logical `company_id`; historical currency, optional FX, and reversal reference; positions and returns are derived in `app/page.tsx`. |
| `tasks` | Research queue | Optional logical `company_id`; supports update and delete actions. |
| `events` | Long-term events and review dates | Optional logical `company_id`; supports create and completion toggle. |
| `journal` | Decision journal timeline | Optional logical `company_id`; current API only appends. |
| `industries` | Industry map / knowledge base | Standalone; current API supports create and update. |
| `valuations` | Bear/Base/Bull DCF assumptions | Logical `company_id`; unique index on `(company_id, scenario)`. |
| `screener_templates` | Saved screener criteria | `criteria` is JSON text; standalone. |
| `investment_snapshots` | Immutable research/thesis snapshots | Logical `company_id`; current API only appends. |
| `assumptions` | Current status of investment assumptions | Logical `company_id`; mutable status/note fields. |
| `assumption_observations` | Append-only assumption checks | Logical `assumption_id`; current assumption status is updated alongside each observation. |
| `evidence` | Claim/evidence/counter-evidence ledger | Logical `company_id`, optional logical `assumption_id`; current API only appends. |
| `source_documents` | Financial/research provenance metadata | Logical `company_id`; title, URL, filing/period dates, currency, unit scale, and verification flag. |
| `app_settings` | Small application settings and migration markers | Key/value table; currently includes `base_currency`, `currency_migration_v1`, and `unit_scale_migration_v1`. |

## Keys and constraints

- Every table has an integer auto-increment primary key named `id`.
- Unique indexes exist for company ticker/market, company/year financial rows,
  and company/scenario valuations.
- Secondary indexes exist for company, status, date, industry, and evidence
  lookups as shown in `database/schema.sql`.
- The current schema does **not** declare `FOREIGN KEY` constraints. The
  integer relationship columns are application-managed. Deletes therefore do
  not cascade automatically.
- `investment_snapshots` is append-only from the API. Generic company metadata
  edits do not create snapshots; explicit review/thesis-change actions do.
- Currency backfills and sample-only unit/provenance seeding are guarded by
  `app_settings` markers in `db/index.ts`.

## Deliberate omissions

There are no separate `watchlist`, `positions`, `portfolio_accounts`, `cash`,
`reviews`, `research_notes`, `research_inbox`, `tags`, `predictions`, or
`thesis_exposures` tables in this version. Watchlist state is encoded in
`companies.status`; positions are derived from `transactions`; the research
queue uses `tasks`; memory uses snapshots, assumptions, observations, and
evidence.
