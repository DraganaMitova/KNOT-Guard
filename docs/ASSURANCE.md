# Assurance Boundaries

KNOT Guard does not claim trust. It separates claims from evidence, and evidence from deployment assumptions.

This document is the rule for how the project talks about security. Strong language must be backed by code, tests, storage semantics, or independent review. If the backing evidence is missing, the claim must be named as a goal or an assumption.

## KNOT Rule

```text
claim is not proof
proof is not authority
authority is not deployment trust
deployment trust is not permanent
```

KNOT Guard's current job is narrower than "make software secure." It creates a runtime boundary where sensitive actions must pass through authority, scope, token consumption, execution, audit, and receipt.

## What This Repository May Claim Today

| Claim | Evidence Today | Boundary |
| --- | --- | --- |
| Authority is explicit | `requestAuthority` API and allow/deny/hold decisions | Host application must call the runtime for protected actions. |
| Scope is bound to execution | token scope and policy-version checks | Host application must provide truthful actor and target data. |
| Tokens are single-use locally | in-memory replay store and concurrent replay test | One process only unless a shared atomic store is configured. |
| Distributed replay can be made atomic | `ReplayStore` contract and real PostgreSQL concurrency integration test | Depends on the deployed database transaction semantics. |
| Audit records are tamper-evident | canonical SHA-256 hash chain and verifier | Does not stop privileged deletion or rollback by itself. |
| Rollback can be detected against a checkpoint | verifier supports expected head hash and record count | Requires external checkpoint authority. |
| Bypass can be reduced by architecture | `ProtectedActionRegistry` pattern and Express route proof | Raw dangerous operations must not be exported elsewhere. |
| Package surface is inspectable | package safety check rejects install/publish hooks | Does not replace independent supply-chain review. |

## What This Repository Does Not Claim Yet

- It is not formally verified.
- It is not independently audited.
- It is not enterprise-certified.
- It is not proven under large-scale production traffic.
- It is not a replacement for IAM, database security, secrets management, incident response, or human approval.
- It does not make audit storage tamper-proof.
- It does not prevent rollback without an external checkpoint authority.
- It does not prove distributed correctness unless the deployment uses a shared atomic replay store and durable audit store.
- It does not prevent bypass if developers expose the raw dangerous operation outside the guarded boundary.

## Allowed Language

Use precise, scoped language:

- "designed to refuse"
- "enforces inside the configured runtime boundary"
- "tamper-evident audit chain"
- "requires an external checkpoint for rollback detection"
- "requires a shared atomic replay store for distributed deployments"
- "self-tested"
- "pre-release security infrastructure"

## Disallowed Language

Do not describe KNOT Guard as:

- tamper-proof
- unhackable
- production-trusted
- enterprise-grade
- formally proven
- independently audited
- cryptographically novel
- a complete security platform

These phrases may appear only when explicitly saying KNOT Guard does not claim them.

## Missing Proofs

The next proof work is concrete:

- crash-recovery tests around consumed tokens and failed side effects
- signed audit-checkpoint example
- signed release artifacts and SBOM
- independent security review
- public issue/advisory process after first tagged release

Until those exist, KNOT Guard should be described as an opinionated authority-governed runtime with local tests, documented assumptions, and an expanding evidence surface.
