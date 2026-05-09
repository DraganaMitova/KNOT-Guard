# KNOT Guard

KNOT Guard is an **authority-governed execution runtime** for sensitive software actions.

It acts like a state-transition firewall: inside the configured runtime boundary, a protected action may execute only when authority, scope, token consumption, and audit all agree.

```text
request observed
-> authority requested
-> scope bound
-> risk reviewed
-> one-use execution token minted
-> token consumed
-> action executed
-> audit appended
-> transition receipt returned
```

## The Core Invariant

```text
request is not authority
authority is not execution
execution is not proof
logs are not audit
```

KNOT Guard is designed to keep backend code from confusing those states.

## Quick Example

```ts
const decision = await knot.requestAuthority({
  actor: currentUser,
  action: "delete_user",
  target: userId,
  reason: "GDPR removal request",
});

const execution = await knot.executeWithReceipt(decision, async () => {
  await users.delete(userId);
  return { deleted: true };
});

console.log(execution.receipt.executionAuditHash);
```

KNOT Guard makes sensitive backend actions:

- authority-explicit
- scope-bound
- non-replayable
- time-limited
- auditable
- receipt-producing
- deny/hold/allow aware

## What KNOT Guard Is Not

KNOT Guard is not a vulnerability scanner, Linux hardening script, dependency auditor, IAM replacement, CI wrapper, policy linter, or generic sandbox.

Those tools inspect systems, dependencies, hosts, or pipelines.

KNOT Guard governs whether a sensitive action is allowed to become reality.

## Workspace

```text
packages/guard
  TypeScript SDK for authority-governed execution.

apps/bank-admin-demo
  Browser demo showing protected banking admin actions and blocked attacks.

apps/authority-runtime-api
  Runnable backend proof with protected refund endpoint, receipts, and audit export.
```

## Runtime Invariants

Within its configured stores and integration boundary, KNOT Guard is designed to refuse common unsafe transitions:

- No authority -> no execution
- Wrong scope -> no execution
- Expired token -> no execution
- Reused token -> no execution
- Missing audit -> no execution
- Risk too high -> deny or hold
- Policy drift -> no execution
- Tampered audit chain -> verifier failure

## Try It

```bash
npm install
npm run build
npm test
npm run benchmark
```

Run the browser demo:

```bash
npm run demo
```

Run the backend proof:

```bash
npm run api
```

## Evidence Surface

This branch includes:

- SHA-256 tamper-evident audit hash chain
- transition receipts from `executeWithReceipt`
- PostgreSQL audit/replay adapter shape
- audit-chain verifier CLI
- adversarial tests for replay, scope mismatch, denial, review hold, audit failure, policy drift, tampering, and replay races
- benchmark harness for authority and execution flow
- explicit versioned threat model and non-goals
- documented persistence and distributed-system requirements
- CI, security scanning, dependency review, and operational-security posture docs

## Trust Status

KNOT Guard is pre-release security infrastructure. The current branch contains code, tests, docs, and demos, but it has not completed independent audit, formal verification, security certification, or large-scale production validation.

KNOT Guard does not claim trust. It separates claims from evidence, and evidence from deployment assumptions.

Read [Assurance boundaries](docs/ASSURANCE.md) for the exact claim language this repository allows.
Read [Trust and evidence](docs/TRUST_EVIDENCE.md) before treating any security claim as production-grade.

Read:

- [Category](docs/CATEGORY.md)
- [KNOT mindset](docs/KNOT_MINDSET.md)
- [Runtime invariants](docs/INVARIANTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [AI agent tool safety](docs/AI_AGENT_TOOL_SAFETY.md)
- [Security model](docs/SECURITY_MODEL.md)
- [Assurance boundaries](docs/ASSURANCE.md)
- [Security limits](docs/SECURITY_LIMITS.md)
- [Trust and evidence](docs/TRUST_EVIDENCE.md)
- [Proof register](docs/PROOF_REGISTER.md)
- [Security review status](docs/SECURITY_REVIEW.md)
- [Security inspection guide](docs/SECURITY_INSPECTION_GUIDE.md)
- [Adversarial testing](docs/ADVERSARIAL_TESTING.md)
- [No-bypass integration](docs/NO_BYPASS_INTEGRATION.md)
- [Threat model v0.1](docs/THREAT_MODEL_V0_1.md)
- [Cryptographic design](docs/CRYPTOGRAPHIC_DESIGN.md)
- [Persistence architecture](docs/PERSISTENCE_ARCHITECTURE.md)
- [Distributed assumptions](docs/DISTRIBUTED_ASSUMPTIONS.md)
- [Operational security](docs/OPERATIONAL_SECURITY.md)
- [Supply-chain posture](docs/SUPPLY_CHAIN.md)
- [Benchmarks](docs/BENCHMARKS.md)
- [Release and adoption status](docs/RELEASE_AND_ADOPTION.md)
- [Release process](docs/RELEASE_PROCESS.md)
- [Roadmap](docs/ROADMAP.md)
- [Changelog](CHANGELOG.md)

## Product Positioning

KNOT Guard is not "unhackable software."

It is a runtime that makes dangerous backend actions pass through proof, authority, scope, execution, and audit before state changes are allowed.

## License

KNOT Guard is licensed under the GNU Affero General Public License v3.0 only (`AGPL-3.0-only`) for open, reciprocal use and public security review. Commercial licensing may be available separately for closed/proprietary deployments. See [LICENSE](LICENSE) and [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md).
