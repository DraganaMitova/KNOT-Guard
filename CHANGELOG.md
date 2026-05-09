# Changelog

## Unreleased

Security-readiness branch:

- Added SHA-256 tamper-evident audit hash chaining.
- Added `AuditStore` and `StoredAuditRecord` interfaces.
- Added runtime tests for allow, deny, hold, replay, tampering, and audit-chain behavior.
- Added adversarial tests for expiry, missing reasons, audit failure, policy drift, verifier tampering, and PostgreSQL token replay semantics.
- Added `ReplayStore`, policy-version token binding, PostgreSQL audit/replay adapter shape, and audit-chain verifier CLI.
- Added transition receipts via `executeWithReceipt`.
- Added category, invariant, architecture, and AI agent tool-safety docs.
- Added runnable authority runtime backend proof.
- Added explicit security limits, adversarial testing, no-bypass integration, and KNOT mindset docs.
- Added rollback/checkpoint and protected-action-registry tests.
- Added local benchmark harness for governed authority/execution flow.
- Added threat model, cryptographic design, persistence architecture, distributed guarantees, benchmark, and roadmap docs.
- Added CI, security scanning, dependency review, repository security policy, and operational-security docs.

## 0.1.0 Prototype

- Initial TypeScript SDK prototype.
- Initial KNOT Bank Admin demo.
- Proprietary license.
