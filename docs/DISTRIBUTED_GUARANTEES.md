# Distributed-System Guarantees

KNOT Guard separates local guarantees from production distributed guarantees.

## Local SDK Guarantees

With the default in-memory runtime:

- decisions are deterministic for the configured policy and request
- allowed tokens are single-use inside one process
- token expiry is checked before execution
- token scope must match the authority decision at execution time
- audit records are hash-chained in append order
- concurrent in-process attempts to execute the same token produce one winner

## Distributed Deployment Requirements

To preserve the same guarantees across multiple processes, a deployment must provide:

- a shared token-consumption store
- atomic compare-and-insert for token consumption
- a durable audit store
- consistent policy versioning
- clock discipline or trusted time
- idempotency keys for protected side effects

## Failure Modes

| Failure | Required Handling |
| --- | --- |
| Process crashes after token consumption but before action | action must be idempotent or recoverable |
| Process crashes after action but before completion audit | reconciliation job must detect pending consumed tokens |
| Two workers execute the same token | shared atomic token-consumption store must allow only one winner |
| Policy changes during request lifecycle | decision should include policy version |
| Clock skew causes early/late expiry | provide trusted server-side time |

## Current Status

The current branch documents these requirements and includes a local concurrent replay test. It does not yet ship a PostgreSQL/Redis adapter, so cross-process replay-race correctness remains a production-adapter requirement.
