# Security Inspection Guide

This guide points reviewers to the parts of KNOT Guard that matter more than README language.

## Dependency List

Runtime SDK package: `packages/guard/package.json`

- No runtime third-party dependencies are required by `@knot/guard`.
- The workspace uses TypeScript for development.
- Demo apps have their own dependencies and are not part of the SDK runtime boundary.

Check:

```bash
npm audit --audit-level=high
npm run security:package
```

`npm run security:package` fails if workspace packages define install, prepare, or publish lifecycle hooks.

## Install Hooks

KNOT Guard intentionally avoids install-time code execution.

The CI package-safety check rejects:

- `preinstall`
- `install`
- `postinstall`
- `prepare`
- `prepublish`
- `prepublishOnly`
- `prepack`
- `postpack`

## Token Generation Logic

Default IDs use `crypto.randomUUID()`.

If the runtime does not provide `crypto.randomUUID()`, KNOT Guard throws instead of falling back to weak randomness.

Relevant file:

- `packages/guard/src/guard.ts`

## Replay Protection

Single-process replay protection:

- `packages/guard/src/replay.ts`

Distributed replay boundary:

- `ReplayStore` interface in `packages/guard/src/types.ts`
- PostgreSQL adapter in `packages/guard/src/postgres.ts`; real concurrency proof is retained on `integration-hardening-pass`

The PostgreSQL shape uses atomic token insertion:

```sql
insert into token_consumptions (...)
on conflict (token_id) do nothing
```

## Clock And Timestamp Assumptions

KNOT Guard checks token expiry with the configured `now()` function.

Production deployments should provide trusted server-side time. KNOT Guard does not solve malicious clock rollback by itself.

Relevant file:

- `packages/guard/src/guard.ts`

## Audit-Chain Integrity

Audit records are SHA-256 hash chained.

Relevant files:

- `packages/guard/src/audit.ts`
- `packages/guard/src/crypto.ts`
- `packages/guard/src/verify.ts`

Important limit:

The audit chain is tamper-evident, not tamper-proof. Rollback detection requires checking against a known head hash and record count.

## Async Race Handling

Covered local tests:

- concurrent same-token execution race
- PostgreSQL atomic token insert semantics
- audit append failure before operation execution

Relevant file:

- `packages/guard/test/guard.test.mjs`

## Enforcement Versus Logging

KNOT Guard enforces before execution:

- denied decisions do not execute
- held decisions do not execute
- expired tokens do not execute
- consumed tokens do not execute
- scope/policy drift does not execute
- audit append failure before execution prevents operation execution

Audit records are not the enforcement mechanism. They are the proof trail after the runtime has made the transition decision.
