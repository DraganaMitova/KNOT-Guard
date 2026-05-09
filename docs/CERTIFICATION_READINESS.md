# Certification Readiness

Status: NOT CERTIFIED.

KNOT Guard is pre-release security infrastructure. This branch is structured as a production-certification candidate: each allowed security claim should map to evidence, tests, threat assumptions, and known limits.

## Current Evidence

- deterministic unit tests for authority, scope, replay, audit, policy drift, review hold, denial, and tampering behavior
- adversarial replay and scope-mismatch tests
- audit-chain verifier with rollback/checkpoint detection
- real PostgreSQL concurrency integration proof retained on the integration hardening branch
- Express protected-route proof using `ProtectedActionRegistry`
- no-bypass integration guidance
- explicit threat model and security limits
- assurance-language gate
- package safety check for install/publish lifecycle hooks

## Not Yet Complete

- independent security audit
- formal verification
- fuzzing campaign
- SAST/DAST report
- SBOM and release provenance
- signed release artifacts
- production deployment validation
- database migration review
- cryptographic design review
- crash-recovery tests around consumed tokens and failed side effects

## Allowed Claim

```text
KNOT Guard is a production-certification candidate for authority-governed execution.
```

This means the repository is organized so reviewers can inspect claims against implementation evidence, tests, assumptions, and limits.

## Forbidden Claim

```text
KNOT Guard is production-certified.
```

The project must not claim production certification until an external process has certified it.

## Claim / Evidence Matrix

| Claim | Evidence | File or Test | Status |
| --- | --- | --- | --- |
| Reused token cannot execute twice with PostgreSQL replay storage | Real PostgreSQL 50-way concurrency proof asserts 1 winner and 49 rejected attempts | Internal integration proof retained on `integration-hardening-pass` | Proven in internal test |
| Raw refund route does not call mutation directly | Express route calls `registry.run("refund_payment", input)` and raw mutation is file-local | `apps/authority-runtime-api/src/app.mjs` and `apps/authority-runtime-api/src/protected-actions/refund-payment.mjs` | Implemented in proof app |
| Audit tampering is detectable | Hash-chain verifier rejects modified records | `packages/guard/test/guard.test.mjs` | Proven in test |
| Rollback is detectable with a known checkpoint | Verifier checks expected head hash and record count | `packages/guard/test/guard.test.mjs` | Proven in test |
| Rollback is prevented by KNOT Guard alone | Not claimed | N/A | Forbidden |
| KNOT Guard protects all backend actions automatically | Not claimed | N/A | Forbidden |
| KNOT Guard prevents bypass when raw operations are exported elsewhere | Not claimed | N/A | Forbidden |
| Package install hooks are absent | Package safety script checks lifecycle hooks | `scripts/check-package-safety.mjs` | Proven in check |

## Certification Rule

```text
implementation evidence is not certified trust
passing tests are not production certification
integration proof is not independent audit
strong architecture is not deployment guarantee
```
