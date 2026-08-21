# Investment Lab

Personal Long-Term Investment Research OS · 长期投资研究工作台

> This repository is a public, sanitized source snapshot intended for
> development and architectural review. It is not the production database and
> it does not contain real private portfolio data.

## What this is

Investment Lab is the current ChatGPT Sites implementation of a personal,
long-horizon investment research workspace. It organizes company research,
financial trends, DCF scenarios, portfolio transactions, industry notes,
decision journals, immutable investment snapshots, assumption tracking, and an
evidence ledger in one data-driven app.

This is a source snapshot of the deployed first phase, not a redesigned clone.
The production source was exported from the Sites checkout at commit
`68880421802db37bd303ed8e5d1f1e0ff29afc74`.

The existing ChatGPT Sites deployment remains separate and unchanged:
[Investment Lab (Owner-only)](https://investment-lab.decent-finch-3957.chatgpt.site)

## Current implementation

Implemented in the snapshot:

- Dashboard with research overview, watchlist-by-status, queue, events, and portfolio shape.
- Company research with business model, moat/management, thesis, financial trends, and red-flag prompts.
- D1-backed transactions, derived positions, industry concentration, and transaction history.
- Five-year demo financial series with trend sparklines and derived metrics.
- DCF Bear / Base / Bull scenarios, fair value, margin of safety, and relative metrics.
- Append-only decision journal and immutable investment snapshots.
- Assumption Tracker with append-only observations.
- Evidence Ledger with support/counter evidence and optional source links.
- Industry Map and 2–5 company comparison.
- Responsive desktop, tablet, and mobile CSS.

The exact feature status, including partial and missing areas, is documented in
[`docs/FEATURES.md`](docs/FEATURES.md).

## Technology

- React 19 + TypeScript
- Next-compatible App Router surface compiled by Vinext/Vite
- Cloudflare Worker runtime
- Cloudflare D1 for persistent storage
- Drizzle ORM and Drizzle migrations
- Plain CSS in `app/globals.css` (no Tailwind utility classes in the product UI)

## Local development

Prerequisites: Node.js `>=22.13.0`, Linux tooling with `flock`, `curl`, and GNU
`timeout` for the provided helper scripts.

```bash
npm run install:ci
npm run dev
```

Useful checks:

```bash
npm run lint
npm run build
npm test
```

`npm run dev` uses the local Vite/Vinext + Miniflare setup declared in
`vite.config.ts`. The local binding is a placeholder; production persistence is
provided by the Sites-injected D1 binding named `DB`.

## Project map

```text
app/page.tsx              all client views and interaction handlers
app/api/data/route.ts     GET/POST application API
app/globals.css           responsive product styles
db/schema.ts              Drizzle schema
db/index.ts               D1 access, schema bootstrap, demo seed data
database/schema.sql       review-friendly SQL schema mirror
drizzle/                  generated migrations and metadata
worker/index.ts           Cloudflare Worker entry
vite.config.ts            Vinext/Vite/Sites local runtime configuration
.openai/hosting.json      Sites project binding configuration
docs/                     architecture, storage, flow, feature, and audit notes
```

## Storage and data policy

The current app uses Cloudflare D1 through the `DB` binding and does not use
browser `localStorage` or `sessionStorage` for application records. See
[`docs/STORAGE.md`](docs/STORAGE.md) and [`docs/DATABASE.md`](docs/DATABASE.md).

The production D1 rows were not exported. The public repository contains only
the schema and demo seed definitions in `db/index.ts`. The built-in NVDA,
Microsoft, ASML, and BYD entries, financial series, journals, snapshots,
assumptions, evidence, tasks, events, industries, and valuations are explicitly
`DEMO DATA` and must be replaced with primary-source research before being used
for decisions.

There are no committed API keys, OAuth tokens, cookies, passwords, database
credentials, or private account records. Use `.env.example` only as a variable
name template; never put real values in Git.

## Review guide

Recommended reading order:

1. `README.md`
2. `docs/AUDIT-MANIFEST.md`
3. `docs/ARCHITECTURE.md`
4. `docs/STORAGE.md`
5. `database/schema.sql`
6. `db/schema.ts` and `db/index.ts`
7. `app/api/data/route.ts`
8. `app/page.tsx`
9. `docs/LIMITATIONS.md`

Start with [`docs/AUDIT-MANIFEST.md`](docs/AUDIT-MANIFEST.md) for a path-level
map of the product and a current audit checklist.

## Scope and limitations

This repository is intended to make the current implementation inspectable. It
does not add market-data providers, brokerage integrations, AI search, account
isolation, sensitivity matrices, thesis-exposure analytics, or prediction
calibration. Known partial and unimplemented features are recorded rather than
hidden; see [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md).

The app is a research tool and does not execute securities trades or provide
investment advice.
