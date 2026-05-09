# Proof Register

This register tracks the difference between what KNOT Guard can show today and what it still owes before stronger trust claims are appropriate.

## Current Proof Artifacts

| Area | Artifact | Status |
| --- | --- | --- |
| Local authority flow | `packages/guard/test/guard.test.mjs` | implemented and tested |
| Scope and policy binding | `packages/guard/test/guard.test.mjs` | implemented and tested |
| Local replay race rejection | concurrent same-token test | implemented and tested |
| Audit-chain verification | `verifyAuditChain` and `knot-guard verify-audit` | implemented and tested |
| Rollback detection with checkpoint | expected head hash and record count test | implemented and tested |
| Audit failure before execution | audit-store failure test | implemented and tested |
| No-bypass pattern | `ProtectedActionRegistry` test and docs | implemented as integration pattern |
| PostgreSQL replay semantics | real PostgreSQL 50-way concurrency integration test | self-tested integration evidence |
| Package install hooks | `scripts/check-package-safety.mjs` | CI enforced |
| Unsupported security claims | `scripts/check-assurance-language.mjs` | CI enforced |

## Missing Proofs

| Missing Proof | Why It Matters | Next Evidence |
| --- | --- | --- |
| Crash-recovery proof | Sensitive side effects can fail between token consumption, action execution, and completion audit. | crash harness with pending-token reconciliation |
| External checkpoint example | Audit chains detect mutation but need a separate authority for rollback detection. | signed checkpoint file and verifier workflow |
| Release signing | Users need to know which artifact came from which release commit. | signed tags, checksums, and npm provenance |
| SBOM | Reviewers need machine-readable dependency evidence. | generated SBOM attached to release |
| Independent review | Self-tests do not replace adversarial external scrutiny. | public review issue or third-party audit report |
| Adoption evidence | Trust grows when real integrations report outcomes. | case study or public integration notes |

## KNOT Interpretation

Missing proof is not hidden. It is named as authority debt.

KNOT Guard should advance by converting each missing proof into one of:

- a test
- a verifier
- a signed artifact
- an external review
- an operational runbook

Until then, the project should say "evidence exists for this boundary" instead of "trust us."
