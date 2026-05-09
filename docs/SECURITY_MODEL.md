# KNOT Guard Security Model

KNOT Guard is an authority-governed execution runtime for sensitive backend actions. It is designed to prevent a common class of invalid software transitions:

```text
request observed -> authority granted -> scope changed -> execution still succeeds
request observed -> token reused -> execution succeeds again
request observed -> audit missing -> state change becomes unprovable
```

## Security Goals

KNOT Guard aims to make sensitive actions:

- explicit: every protected execution must begin with an authority request
- scope-bound: authority is bound to actor, action, target, and scope
- non-replayable: execution tokens are consumed once
- time-limited: execution tokens expire
- review-aware: high-risk policy can deny or hold before execution
- auditable: authority and execution events are written as a hash chain

## Non-Goals

KNOT Guard does not claim to be unhackable. It does not replace:

- identity providers
- authentication
- database authorization
- encryption at rest
- cloud IAM
- application-level input validation
- human review workflows
- legal/compliance review

It is a runtime boundary between "someone requested a dangerous state change" and "the system is allowed to execute that state change."

## Threat Model

### In Scope

KNOT Guard is intended to resist:

- direct execution without an authority decision
- reused execution tokens
- expired execution tokens
- target, action, actor, or scope changes after authority is granted
- missing audit records for authority and execution events
- accidental role-only authorization patterns
- critical actions bypassing review policy

### Out of Scope In The Current SDK

The current SDK does not yet provide production-grade protection against:

- compromised application servers
- malicious database administrators
- distributed replay across multiple runtime processes unless a shared atomic replay store is used
- clock manipulation unless monotonic/trusted time is provided
- policy tampering unless policies are externally versioned and protected
- deleted local in-memory audit records after process exit

## Trust Boundaries

KNOT Guard trusts the host application to provide:

- authenticated actor identity
- current actor roles/claims
- truthful target identifiers
- a correct policy configuration
- a reliable `now()` source when token expiry matters
- a durable `AuditStore` for production deployments

## Current Guarantees

With the default in-memory store, KNOT Guard guarantees these properties inside one process:

- an allow decision is required before execution
- a token cannot be executed twice
- a token cannot be used after expiry
- a token cannot be used for a changed actor, action, target, or scope
- each audit record links to the previous record hash

For multi-process or production systems, replay protection and audit appends must use a shared storage layer with atomic conditional writes. See [persistence architecture](./PERSISTENCE_ARCHITECTURE.md).

## Maturity

This repository is a product-readiness branch for the SDK. It contains a working runtime, tests, benchmark harness, and security architecture docs. It should still be treated as pre-release software until a production storage adapter, external audit verification tool, and release process are added.
