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
  assumption observations, evidence, source documents, and the base-currency
  setting.
- `POST` sends an `action` plus payload. `app/api/data/route.ts` validates basic
  strings/numbers, validates transaction/DCF invariants, and writes through
  Drizzle.
- The page refreshes the complete `AppData` payload after a successful write.

## Initialization behavior

`ensureDatabase()` runs at the beginning of both API handlers. It:

1. Executes `CREATE TABLE IF NOT EXISTS` and index statements.
2. Creates `source_documents` and `app_settings` when absent.
3. Adds currency, unit-scale, provenance, FX, reversal, and snapshot metric
   columns when upgrading an older table.
4. Performs one-time currency/unit backfills using idempotency markers.
5. Seeds demo rows only when the relevant table is empty; demo source documents
   are restricted to `is_sample=1` companies.

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
