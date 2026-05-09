# KNOT Guard

KNOT Guard is an **authority-governed execution runtime** for sensitive software actions.

It acts like a state-transition firewall: a protected action may execute only when authority, scope, token consumption, and audit all agree.

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

KNOT Guard prevents backend code from confusing those states.

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

## Runtime Guarantees

KNOT Guard refuses common unsafe transitions:

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

## Security Proof Surface

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

Read:

- [Category](docs/CATEGORY.md)
- [Runtime invariants](docs/INVARIANTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [AI agent tool safety](docs/AI_AGENT_TOOL_SAFETY.md)
- [Security model](docs/SECURITY_MODEL.md)
- [Threat model v0.1](docs/THREAT_MODEL_V0_1.md)
- [Cryptographic design](docs/CRYPTOGRAPHIC_DESIGN.md)
- [Persistence architecture](docs/PERSISTENCE_ARCHITECTURE.md)
- [Distributed guarantees](docs/DISTRIBUTED_GUARANTEES.md)
- [Operational security](docs/OPERATIONAL_SECURITY.md)
- [Supply-chain posture](docs/SUPPLY_CHAIN.md)
- [Benchmarks](docs/BENCHMARKS.md)
- [Release and adoption status](docs/RELEASE_AND_ADOPTION.md)
- [Roadmap](docs/ROADMAP.md)
- [Changelog](CHANGELOG.md)

## Product Positioning

KNOT Guard is not "unhackable software."

It is a runtime that makes dangerous backend actions pass through proof, authority, scope, execution, and audit before state changes are allowed.

## License

KNOT Guard is proprietary software. No permission is granted to use, copy, modify, distribute, host, deploy, or create derivative works without a separate written commercial license from Dragana Mitova. See [LICENSE](LICENSE).
