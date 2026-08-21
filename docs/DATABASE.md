# Database model

The current database is a D1/SQLite schema accessed through Drizzle. The
authoritative TypeScript definitions are in `db/schema.ts`; the SQL mirror for
review is `database/schema.sql`.

## Entity map

```text
Company (companies)
├── Financial rows (financials)
├── Transactions (transactions) → derived positions / portfolio metrics
├── Valuation scenarios (valuations)
├── Investment snapshots (investment_snapshots)
├── Assumptions (assumptions) → observation history (assumption_observations)
├── Evidence items (evidence)
├── Journal entries (journal)
├── Research tasks (tasks)
└── Upcoming events (events)

Industry knowledge (industries) and screener templates (screener_templates)
are standalone collections.
```

## Tables currently present

| Table | Role | Relationship notes |
| --- | --- | --- |
| `companies` | Current company research record | Root entity for most company-linked rows; `is_sample` marks demo companies. |
| `financials` | One row per company/year | Logical `company_id`; unique index on `(company_id, year)`. |
| `transactions` | Append-only buy/sell ledger | Logical `company_id`; positions and returns are derived in `app/page.tsx`. |
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

## Keys and constraints

- Every table has an integer auto-increment primary key named `id`.
- Unique indexes exist for company ticker/market, company/year financial rows,
  and company/scenario valuations.
- Secondary indexes exist for company, status, date, industry, and evidence
  lookups as shown in `database/schema.sql`.
- The current schema does **not** declare `FOREIGN KEY` constraints. The
  integer relationship columns are application-managed. Deletes therefore do
  not cascade automatically.

## Deliberate omissions

There are no separate `watchlist`, `positions`, `portfolio_accounts`, `cash`,
`reviews`, `research_notes`, `research_inbox`, `tags`, `predictions`, or
`thesis_exposures` tables in this version. Watchlist state is encoded in
`companies.status`; positions are derived from `transactions`; the research
queue uses `tasks`; memory uses snapshots, assumptions, observations, and
evidence.
