# Architecture

## Snapshot identity

This document describes the source that was deployed from the Sites checkout at
commit `68880421802db37bd303ed8e5d1f1e0ff29afc74`. The public repository is an
independent audit copy. It is not wired to push changes back to the production
Site.

## Runtime shape

```mermaid
flowchart TD
  U[User] --> UI[React client in app/page.tsx]
  UI --> API[GET/POST /api/data]
  API --> DAL[db/index.ts + Drizzle]
  DAL --> D1[Cloudflare D1 binding DB]
  W[worker/index.ts] --> UI
```

### Frontend

- Framework surface: React 19 with the Next-compatible App Router API, built by
  Vinext and Vite for the Cloudflare runtime.
- Entry page: `app/page.tsx`.
- Document metadata/layout: `app/layout.tsx`.
- Styles: `app/globals.css`.
- Component structure: the current version intentionally keeps the product
  views and small reusable UI helpers in one client component module. There is
  no `src/components/` directory in this snapshot.
- State management: React `useState` and `useEffect` only. There is no Redux,
  Zustand, React Query, or browser persistence layer.
- Routing: a client-side `View` union and `setView` state drive the dashboard,
  research, memory, portfolio, valuation, industry, compare, and journal
  screens. There are no URL route files for these views.

Main view functions in `app/page.tsx` include:

- `Dashboard`
- `ResearchView`, `CompanyList`, `CompanyDetail`, `QueueView`, `ScreenerView`
- `MemoryView`
- `PortfolioView`
- `ValuationView`
- `IndustryView`
- `CompareView`
- `JournalView`
- `Composer` for company, task, event, journal, transaction, and industry forms

## Backend

- API route: `app/api/data/route.ts`.
- `GET /api/data` initializes the schema if necessary, then reads all current
  entity tables into one `AppData` payload.
- `POST /api/data` dispatches on an `action` string and performs inserts,
  updates, deletes, and valuation upserts.
- Data access: `db/index.ts` exposes `getDb()` using `drizzle-orm/d1` and the
  Cloudflare Worker `env.DB` binding.
- Worker entry: `worker/index.ts` delegates requests to Vinext and handles the
  image optimization path.

`app/chatgpt-auth.ts` contains reusable ChatGPT identity helpers, but the
current page and data API do not import them. Production privacy is therefore
provided by the Sites access policy (currently Owner-only), not by per-row
application authorization.

## Database

The database is Cloudflare D1 (SQLite-compatible). Drizzle definitions are in
`db/schema.ts`; the runtime bootstrap and seed path is in `db/index.ts`; the
generated migration history is in `drizzle/`; the review mirror is
`database/schema.sql`.

The current schema does not declare SQL foreign-key constraints. Relationships
are represented by integer ID columns and respected by application code. This
is documented explicitly in `docs/DATABASE.md`.

## Deployment

`vite.config.ts` imports `.openai/hosting.json`, declares the D1 binding for
local development, loads Vinext, and enables the Cloudflare Vite plugin.
ChatGPT Sites builds the pushed source with `npm run build`, then runs the
Worker-backed artifact with the `DB` binding. Details and the production
non-modification boundary are in `docs/DEPLOYMENT.md`.


## P1 source-workflow overlay (commit db197e0)

The P1 implementation adds a dedicated `SourceDocumentsView` in `app/source-documents-view.tsx`. It is mounted as the `sources` client view from `app/page.tsx`.

The API now returns `sourceDocuments` from `GET /api/data` and dispatches source/financial actions from `POST /api/data`: `create_source_document`, `update_source_document`, `delete_source_document`, `create_financial`, `update_financial`, `delete_financial`, and `import_financial_csv`.

The P1 migration is `drizzle/0003_secret_mister_fear.sql`; `db/index.ts` also performs idempotent additive column checks for older D1 databases.
