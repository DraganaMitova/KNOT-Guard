# Threat Model v0.1

This document is the versioned security boundary for the current KNOT Guard SDK.

## v0.1 Protects Against

KNOT Guard v0.1 protects against these invalid transitions in a correctly integrated backend:

- execution without an allow decision
- execution with a denied or held decision
- replay of an already consumed token
- token use after expiry
- actor, action, target, scope, or policy-version mutation after authority is granted
- missing reason when policy requires a reason
- critical action execution without review hold
- audit-chain mutation after records are written
- in-process replay races against the same token

## v0.1 Provides

- TypeScript SDK runtime
- policy-defined roles and scopes
- deny/hold/allow authority decisions
- one-use execution tokens
- `ReplayStore` abstraction
- default in-memory replay protection
- PostgreSQL replay/audit adapter shape
- tamper-evident SHA-256 audit chain
- audit-chain verification function and CLI
- adversarial runtime tests
- benchmark harness
- operational security and supply-chain CI workflows

## v0.1 Does Not Yet Prove

- large-scale production adoption
- independent cryptographic review
- independent penetration testing
- formal verification
- Byzantine or malicious-database resistance
- distributed replay correctness without a shared atomic replay store
- exactly-once external side effects
- crash-safe recovery for every protected action
- compliance certification

## Required For Production Use

Production deployments must provide:

- durable `AuditStore`
- shared atomic `ReplayStore`
- protected policy deployment process
- trusted server-side time source
- idempotency keys for external side effects
- reconciliation job for consumed tokens without completion records
- audit-chain verification job

## Current Classification

KNOT Guard v0.1 is a credible pre-release security runtime, not a high-assurance or enterprise-certified authorization platform.
