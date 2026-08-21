# Demo data policy

The current source keeps demo seed definitions in `db/index.ts` so a newly
created D1 database can render the product workflow immediately.

The following are explicitly illustrative `DEMO DATA`:

- NVDA, Microsoft, ASML, and BYD company records
- five-year financial arrays
- tasks, events, industries, journals, valuations, snapshots, assumptions,
  assumption observations, and evidence

These rows are not an export of the user's production D1 database. They contain
no real portfolio positions, account balances, transaction history, private
research notes, or private journals. Replace them with primary-source inputs
before using a local clone for investment decisions.
