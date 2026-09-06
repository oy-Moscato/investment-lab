# Limitations and acceptance holds

- Browser acceptance is partial: shared preview switched to another active Site before final submit/failure/mobile checks. These did not pass by implication.
- Actual production schema/records were not inspected. Fixture success does not establish production migration compatibility. Reconcile its journal and any runtime-created columns first.
- Legacy financial basis/company currency need explicit confirmation. Missing historical trade currencies are not inferred; correction workflow remains #4.
- SQL foreign keys across all entities are incomplete (#5). New triggers cover touched ledger/source/financial flows, not every task/event/evidence association.
- Source edit history and financial correction history are incomplete. Financial deletion is real deletion; #18 remains open. Append-oriented history is not cryptographic tamper proofing.
- Inherited observation deduplication is read-before-insert, not an idempotency-key protocol. The inherited observation-delete endpoint remains; broader memory lifecycle review is pending.
- Ordinary create requests have no durable idempotency keys. After a lost response, read back before retrying. Exactly-once delivery is not claimed.
- unitScale applies to total money/share counts, not EPS/percentage ratios. Per-field units and fiscal/consolidation modeling remain future work. Legacy snapshots did not store currency/basis and remain ambiguous.
- DCF is same-currency only. Current FX quotes and automated feeds are absent. Execution FX is historical and is not used as a current valuation quote.
- Cash, dividends, corporate actions, tax lots, shorts, closed-position performance and benchmarks remain incomplete (#7).
- Search, sensitivity, thesis exposure, calibration, semantic AI memory and account integrations remain Roadmap tasks. The inert topbar search button was removed.
- Existing typography/density/responsive design still needs dedicated browser QA. No visual redesign is claimed.
- Private Sites access remains required; no app-level multi-user isolation exists. Never publish personal-finance data on an unrestricted audit deployment.

These limits are not a declaration that #3–#20 are complete. See `RESTART-REVIEW.md` for evidence and the rollout hold.
