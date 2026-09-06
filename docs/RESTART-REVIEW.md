# Restart review — 2026-09-06

## Verified baseline

| Surface | Revision | Actual state |
| --- | --- | --- |
| Sites main at restart | `2cbdb77dc9c3b6ec6fa64b70781d8b45112164c2` | Responsive layout and observation deduplication; neither P0 nor P1 source workflow |
| Sites saved version 4 | Same `2cbdb77` | Saved identity confirmed; no production database inspected |
| Sites source workflow branch | `db197e041d6cb1dce7f9760dfebedcf711c8bb61` | P1 sibling branch, not an ancestor of main |
| Public PR #2 | `4964737ee1148a5e73cd6fa2237a6156b65c3472` | P0 implementation snapshot, separate from Sites main/P1 |
| Public PR #22 | `889afb7a8800fb52f5122b5827085b59dda09182` | P1 review, unmerged |
| Public main | `691d0a4d6d9af1174c2817c46002b2354e0de589` | Original audit snapshot |

`git log --all --graph --oneline` reproduces the lineage. The restart branch merges saved P1 into current Sites main and ports selected P0 changes with explicit conflict resolution. Later responsive CSS and observation workflows are retained. No previous branch was reset or force-pushed; old PRs/Issues remain open.

## Findings and changes

| Defect found in recovered code | Consequence | Correction |
| --- | --- | --- |
| P0, P1 and current main are separate lines | Later work omits earlier safeguards | One integrated source branch and public review candidate |
| Main accepts oversells; P0 prechecks outside INSERT | Negative balances or concurrent overselling | Server validation plus atomic chronological-prefix trigger; executed rows reject UPDATE/DELETE |
| Ordinary company editing inserts snapshots | Metadata contaminates investment history | Explicit snapshot action only |
| Save swallows rejection; refresh failure appears successful | Forms lose drafts and falsely report success | Boolean save outcome; failed drafts retained; saved-but-stale and uncertain network outcomes distinguished |
| CSV chooses page company before row ticker | Financials attach to the wrong company | Row identity wins; ambiguous ticker and ID/ticker mismatch reject |
| CSV invalid numbers become zero | Plausible corrupted financial data | Bad numbers/quotes/headers and duplicate company-years reject |
| Sequential CSV writes and overwrite rechecks | Partial import or insert-mode overwrite | One transactional D1 batch, unique company/year, strict insert and explicit partial upsert |
| Financial edit can reassign another company's record | Cross-company corruption | Ownership check and database trigger |
| Full working capital subtraction and fabricated DCF defaults | Incorrect/unsupported valuation | Annual NWC change, terminal-period NWC at terminal growth, input/basis validation and authoritative server calculation |
| Last execution FX supplies current valuation | False market value and historical relabeling | Execution FX and original base currency retained; never treated as a current quote |
| Missing price replaced by average cost | Invented market value and zero profit | Missing quote remains unavailable |
| Unnormalized scales enter trends | Artificial growth | Normalize money/share counts; preserve EPS and percentage points; suppress unconfirmed/mixed-currency trends |
| GET creates schema/seeds/backfills | Reading modifies historical data | Migration-owned schema, read-only GET, explicit local synthetic seed |

## Numeric boundaries

Company currency means security/quote currency. Legacy rows have `currencyVerified = 0`: an inherited USD default is not evidence. Company editing explicitly confirms currency. Financial reporting currency is independent; old financial rows retain numbers with `basisConfirmed = 0` and no invented source.

`unitScale` applies to monetary totals and share counts. EPS is native currency/share. ROE/ROA/ROIC use percentage points (15 means 15%). Validated manual financial saves/imports confirm the submitted basis.

DCF supports matching reporting and security currencies only. It uses actual revenue, explicit share count, annual NWC change, a terminal NWC increment at terminal growth, and validated assumptions. No fallback revenue of 100 or automatic replacement of a share count of 1. Company enterprise value is in native currency units; EBIT is scaled accordingly.

Current portfolio totals require confirmed native currency matching the selected base and available quotes. Other cases show currency subtotals or unavailable values. Execution FX is pinned to its original base currency and is not a current FX quote. Historical transactions with absent currency are preserved rather than relabeled. Their correction workflow remains #4.

## Validation evidence

- Full test run: **34/34 passed**, including the product build.
- Type checking and lint passed after removing an unused prop binding.
- **15 D1 behavior cases** use Miniflare D1 with the same handler factory as the real route: concurrent sells, backdating, forced mid-batch rollback, fresh-handler persistence, ownership/reference checks, explicit snapshots, DCF save, legacy migration and FX history.
- Migration fixture starts from 0000–0002, inserts synthetic company/financial/transaction/journal rows, applies subsequent migrations, and verifies original values survive with unconfirmed basis.
- Pure tests cover NWC, scale invariance, mixed currency, missing quotes, CSV parsing and persistence state transitions. Older source/build-presence tests remain and are not presented as behavioral evidence.
- Agent preview loaded dashboard and source view, displayed separate USD/HKD subtotals, and showed a synthetic year bound to its synthetic source with USD/millions metadata.
- **Browser acceptance is partial.** Another active Site subsequently replaced the container's shared preview. No action was taken on that unrelated Site. Final form submission, visible failure paths and mobile/tablet browser checks remain unverified. Function/API tests are not browser tests.

## Migration and deployment hold

- Original migrations 0000–0002 and their metadata are unchanged.
- 0003 restores saved P1 additive schema; 0004 adds correctness fields/settings and database guards; 0005 pins execution FX's base currency. Triggers live in 0004 SQL and are not modeled by Drizzle snapshots.
- No production D1 reads, resets, seeds, backfills or migrations; no Site versions saved or deployed in this restart.
- Before deployment: back up production, compare its actual schema and migration journal to the expected 0000–0002 baseline, inspect legacy records requiring correction, finish browser QA, and review the integrated diff. If an earlier runtime compatibility routine already added columns, do not blindly execute duplicate ALTER statements; prepare schema-specific reconciliation.
- Rollback means restoring reviewed code while keeping additive schema. Do not drop data-bearing columns/tables. Applied transaction guards persist across code rollback. Failed deployment may leave migrations applied; inspect the applied boundary before retrying.
- Full foreign keys, correction UI, backup/restore and lifecycle semantics remain #4/#5/#17/#18; they are not closed by this pass.

Next bounded acceptance task: finish browser checks on this exact branch with exclusive preview access, then review migration baseline/correction requirements. Coordinate in #23 and keep the #21 order. Do not start P2–P4 from an unintegrated baseline.
