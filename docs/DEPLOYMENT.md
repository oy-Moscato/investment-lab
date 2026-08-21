# Deployment

## Current production Site

The current production Site is the private, Owner-only ChatGPT Sites
deployment:

<https://investment-lab.decent-finch-3957.chatgpt.site>

This GitHub snapshot does not change its access policy, data, domain, source
version, or deployment. The implementation represented here is `9904d25`
from the private/current Sites checkout.

## Sites configuration

`.openai/hosting.json` is included because it is part of the actual Sites
checkout. The public copy keeps the D1 binding name but redacts the Site project
identifier. The public GitHub repository is not connected to an automatic
production deploy by this task.

## Build path

ChatGPT Sites builds the source using the project scripts:

```text
Sites source checkout
→ npm run build
→ scripts/build-verified.sh
→ vinext build
→ Cloudflare Worker/Vite artifact
→ D1 binding DB at runtime
```

The Worker entry point is `worker/index.ts`; local binding simulation is in
`vite.config.ts`.

## Local commands

```bash
npm run install:ci
npm run dev
npm run build
npm test
```

The provided install/build helpers are Linux-oriented and use GNU `timeout`.

## Important safety note

Do not point a new checkout at the production Sites project and checkpoint it
unless a deliberate production change is intended. The audit repository is a
review artifact. A future public GitHub-based deployment should use a separate
Sites project and a separate D1 database.
