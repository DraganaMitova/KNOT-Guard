# KNOT Guard

KNOT Guard is an authority-governed runtime for sensitive software actions.

It prevents unauthorized state transitions by separating request, authority, scope, execution, and audit. The goal is simple: dangerous actions should never happen just because code reached an `if user.role === "admin"` branch.

```ts
const decision = await knot.requestAuthority({
  actor: currentUser,
  action: "delete_user",
  target: userId,
  reason: "GDPR removal request"
});

await knot.execute(decision, async () => {
  await users.delete(userId);
});
```

KNOT Guard makes sensitive backend actions:

- authority-explicit
- scope-bound
- non-replayable
- time-limited
- auditable
- deny/hold/allow aware

## Workspace

```text
packages/guard
  TypeScript SDK prototype for authority-governed execution.

apps/bank-admin-demo
  Small browser demo showing protected banking admin actions and failed attacks.
```

## MVP Guarantees

KNOT Guard refuses common unsafe transitions:

- No authority -> no execution
- Wrong scope -> no execution
- Expired token -> no execution
- Reused token -> no execution
- Missing audit -> no execution
- Risk too high -> hold/review

## Try The Demo

```bash
npm install
npm run demo
```

Then open the local URL printed by Vite.

## Build The SDK

```bash
npm install
npm run build
npm test
npm run benchmark
```

## Security Readiness

This branch turns the prototype into a more concrete security architecture preview:

- SHA-256 tamper-evident audit hash chain
- runtime tests for replay, scope mismatch, denial, review hold, audit chaining, audit failure, policy drift, and replay races
- PostgreSQL audit/replay adapter shape
- audit-chain verifier CLI
- local benchmark harness for authority and execution flow
- explicit threat model and non-goals
- documented persistence and distributed-system requirements
- CI, security scanning, dependency review, and operational-security posture docs

Read:

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
