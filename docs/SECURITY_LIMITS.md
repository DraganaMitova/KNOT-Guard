# Security Limits

KNOT Guard follows a KNOT rule: no claim is allowed to masquerade as proof.

This document states what the runtime does not prove by itself, and how KNOT turns each limit into an explicit authority boundary.

These limits are not product failures. They are unsafe only when hidden. KNOT's answer is to make each one visible, named, and testable.

## Audit Chain Limits

The SHA-256 audit chain is tamper-evident, not tamper-proof.

It can detect:

- changed records
- broken previous-hash links
- sequence gaps
- rollback or deletion when checked against a known head hash and record count

It does not automatically prevent:

- privileged database deletion
- rollback to an older valid chain
- insider suppression before a record is written
- compromised application servers
- compromised storage administrators
- time-source manipulation

Rollback resistance requires an external checkpoint, such as:

- signed daily head hashes
- immutable object storage
- a separate security account
- external timestamping
- a monitored audit verifier job

## KNOT Answer: Checkpoint Authority

The audit chain detects mutation inside the chain. Checkpoint authority detects rollback of the chain itself.

Production KNOT deployments should publish or store checkpoints:

```text
audit head hash
record count
created_at
signing identity or storage authority
```

Then verification becomes:

```bash
knot-guard verify-audit audit.jsonl --head <known-head-hash> --count <known-record-count>
```

This does not make the database magically trustworthy. It separates database storage from audit authority, which is the KNOT move.

## Distributed-System Limits

Distributed replay protection is only as strong as the shared `ReplayStore`.

For production, token consumption must be atomic across all workers. A local in-memory store is not enough for multi-node deployments.

KNOT Guard currently provides:

- in-process replay-race rejection
- `ReplayStore` abstraction
- PostgreSQL adapter shape using `insert ... on conflict`

It does not yet provide:

- formal distributed consistency proof
- production load testing across many nodes
- crash-recovery proof for every external side effect
- consensus or Byzantine fault tolerance

## KNOT Answer: Storage Authority

Distributed correctness cannot be inferred from local memory. KNOT requires a shared storage authority for token consumption.

For production, `ReplayStore.consume()` must be backed by an atomic write:

```text
token_id inserted once
all competing executions lose
only the winner may continue to audit and execute
```

The PostgreSQL adapter shape uses `insert ... on conflict (token_id) do nothing` for this reason. The storage layer becomes the authority for replay uniqueness.

## Operator Limits

KNOT Guard cannot protect an action that developers expose outside the runtime.

The protected operation should be private to a registry, module, or service boundary. Application routes, tools, jobs, and AI agents should call the protected wrapper, not the raw operation.

## KNOT Answer: Execution Registry Authority

Bypass prevention is not solved by telling developers to behave. It is solved by shaping the code boundary.

KNOT's recommended pattern is:

```text
raw operation is not exported
protected registry owns the operation
callers invoke registry.run()
registry requests authority
registry executes only with receipt
```

This gives the application one obvious execution path and makes bypasses easier to detect in code review and tests.

## Honest Classification

KNOT Guard is an opinionated authority-governed execution runtime with a growing evidence surface.

It is not yet:

- reviewed by an external security auditor
- formally verified
- enterprise-certified
- battle-tested at large scale
- a replacement for IAM, database security, or operational controls

See [Trust and evidence](TRUST_EVIDENCE.md) for the current claim-by-claim evidence level.
