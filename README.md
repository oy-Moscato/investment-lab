# Investment Lab

Personal Long-Term Investment Research OS

This repository is a public, sanitized source snapshot intended for development and architectural review.

Start with [the restart review](docs/RESTART-REVIEW.md) and [audit manifest](docs/AUDIT-MANIFEST.md). Earlier P0/P1 work and current Sites main were separate branches. This branch integrates them and adds tested correctness safeguards. It is a **review candidate, not an approved deployment**.

Repository 中不存在真实私人投资数据。Only explicitly synthetic local fixtures are included. Production D1 records were neither read nor exported in this restart.

## Run and verify

Node.js 22.13+ and npm are required. Preserve the lockfile.

```sh
npm ci
npm run typecheck
npm run lint
npm test
```

`npm test` builds the Worker and runs all tests. `npm run test:behavior` runs financial, CSV, persistence-state and Miniflare D1 tests without rebuilding the product. Tests do not access remote databases.

For local development:

```sh
npm run db:preview
npm run dev
```

`node scripts/prepare-preview.mjs --demo` optionally seeds two fictional companies into an empty **local** database. It has no remote mode and skips seeding when records already exist. In ChatGPT Work, use the Sites supervised preview instead of starting a second dev server.

## Structure and storage

- `app/page.tsx`: research, portfolio, valuation and memory UI.
- `app/source-documents-view.tsx`: source/financial editors and CSV preview.
- `app/api/data/route.ts`: thin Worker binding adapter.
- `server/data-service.ts`: real request handlers and database operations.
- `lib/`: validation, finance, unit normalization, CSV and persistence-state logic.
- `db/schema.ts`, `drizzle/`: Drizzle/D1 schema and migrations.
- `tests/`: logic, real local D1 behavior and migration fixtures.
- `scripts/prepare-preview.mjs`: local-only setup and optional synthetic seed.

Stack: React, Vinext/Vite, Cloudflare Worker, D1 and Drizzle. Product data lives in D1. GET does not initialize schema, reseed tables or invent historical provenance. Data is entered manually or through CSV; no automatic market/financial feed exists.

## Status

Build, type checking and tests pass. Browser acceptance is partial due to shared-preview contention. See [features](docs/FEATURES.md), [limitations](docs/LIMITATIONS.md), [data flow](docs/DATA-FLOW.md) and [rollout boundaries](docs/RESTART-REVIEW.md).

The public hosting manifest is sanitized. **Do not deploy from this audit repository.** Retain the real Site identity, access and data in its source checkout. No production release was made during this pass.
