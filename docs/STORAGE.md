# Storage and persistence

## Actual production storage

The deployed Investment Lab uses Cloudflare D1, a SQLite-compatible managed
database, through the binding named `DB`. The binding name is declared by
`.openai/hosting.json` and consumed by `db/index.ts`:

```ts
import { env } from "cloudflare:workers";
return drizzle(env.DB, { schema });
```

The current source does not use R2, KV, a hosted JSON file, IndexedDB,
`localStorage`, or `sessionStorage` for application records. `r2` is `null` in
the Sites configuration.

## Read/write path

The browser calls `/api/data` from `app/page.tsx`:

- `GET` returns companies, financials, transactions, tasks, events, journal
  entries, industries, valuations, screener templates, snapshots, assumptions,
  assumption observations, and evidence.
- `POST` sends an `action` plus payload. `app/api/data/route.ts` validates basic
  strings/numbers and writes through Drizzle.
- The page refreshes the complete `AppData` payload after a successful write.

## Initialization behavior

`ensureDatabase()` runs at the beginning of both API handlers. It:

1. Executes `CREATE TABLE IF NOT EXISTS` and index statements.
2. Adds the five snapshot metric columns when upgrading an older snapshot table.
3. Seeds demo rows only when the relevant table is empty.

This means a newly created D1 database is not empty after the first request. The
seed constants are deliberately marked `DEMO DATA` in `db/index.ts` and are not
the user's real portfolio.

## Production data boundary

No production D1 export was performed and no production rows are committed in
this public repository. The repository contains the application code, schema,
migrations, and demo seed definitions only. A reviewer must supply a separate
D1 binding or test database to run a real data instance.

## Authentication boundary

The production Site is private/Owner-only. The current `/api/data` route does
not call `requireChatGPTUser()` or otherwise scope rows to a user. If the Site
access policy is changed to public or shared access, application-level
authorization would need to be added before using private records.

## Local development

`vite.config.ts` creates a local placeholder D1 binding for the Vite/Miniflare
preview. This is useful for rendering and development, but it is not the
production D1 database. Local generated state belongs under ignored runtime
directories and must not be committed.


## P1 provenance persistence

Financial provenance is stored in D1, not browser storage. The `source_documents` table stores document-level identity and coverage; each `financials` row stores its own `period_end`, `filing_date`, `currency`, `unit_scale`, `data_status`, optional `source_document_id`, and `audit_note`.

The local/Preview migration is additive. Existing non-sample financial rows are not assigned synthetic sources. Built-in sample rows are explicitly marked `DEMO DATA` and receive seeded demo provenance only.
