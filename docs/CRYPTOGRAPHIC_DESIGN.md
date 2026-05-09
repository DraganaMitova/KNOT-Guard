# Cryptographic Design

KNOT Guard uses SHA-256 hash chaining for tamper-evident audit records.

## Audit Hash Chain

Each stored audit record contains:

- `sequence`
- `previousHash`
- `hash`

The hash is computed from a canonical JSON representation of the stored record with the `hash` field omitted.

```text
record_1.previousHash = null
record_1.hash = sha256(canonical(record_1_without_hash))

record_2.previousHash = record_1.hash
record_2.hash = sha256(canonical(record_2_without_hash))
```

This makes deletion, insertion, or mutation detectable when the chain is verified from the beginning or against a known checkpoint.

## What This Proves

The audit chain proves that:

- a record has not changed since its hash was produced
- record order has not changed without detection
- inserted or removed records break downstream hash links

## What This Does Not Prove Yet

The current SDK does not yet provide:

- digital signatures
- external timestamping
- Merkle batching
- remote notarization
- hardware-backed keys
- cryptographic proof that the host application could not suppress writes before they happen

## Production Hardening Path

Production deployments should add:

- signed audit checkpoints
- immutable storage such as object-lock buckets or append-only database tables
- external hash anchoring to a separate account or system
- key rotation and key custody procedures
- periodic audit-chain verification jobs

## Audit Verification CLI

KNOT Guard includes a local verifier for JSON or JSONL audit exports:

```bash
knot-guard verify-audit audit.jsonl
```

The verifier checks sequence order, previous-hash links, and each record hash.

## Token Design

Execution tokens are opaque runtime objects bound to:

- decision id
- actor id
- action
- target
- scope
- issued time
- expiry time

Tokens are not bearer JWTs in the current SDK. They are designed to be passed inside trusted backend code, not exposed to browsers or clients.
