# Database

Drizzle schema: `db/schema.ts`. Migrations: `drizzle/`. See `RESTART-REVIEW.md` for applied-history and rollback precautions.

| Entity | Relationship |
| --- | --- |
| companies | Root security/research record; quote currency + explicit confirmation |
| financials | company_id; unique company/year; optional source_document_id; reporting currency, scale and basis confirmation |
| source_documents | company_id; document metadata; referenced deletions rejected |
| transactions | company_id; append-only execution ledger, historical currency and optional execution FX/base |
| valuations | company_id; scenario assumptions and server-calculated fair value |
| investment_snapshots | company_id; explicit research snapshots |
| assumptions | company_id |
| assumption_observations | assumption_id; inherited observation semantics |
| evidence | company_id and optional assumption_id |
| journal/tasks/events | optional company association |
| industries | Independent research maps |
| screener_templates | Saved criteria |
| app_settings | Key/value, currently selected base currency |

Most legacy relationships lack SQL foreign keys. New triggers protect touched source/financial relationships and chronological ledger balances; they are not a complete FK migration. GET never seeds, backfills, creates or alters tables. Local fixtures and setup are separate. No production records are included.
