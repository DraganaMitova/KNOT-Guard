# Adversarial Testing

KNOT Guard tests are organized around invalid transitions.

## Covered Attacks

The current test suite covers:

- execution without authority
- wrong actor role
- scope mismatch
- critical action hold
- tampered decision target
- replayed token
- concurrent replay race against one token
- expired token
- missing required reason
- audit append failure before operation execution
- policy-version drift
- audit-record mutation
- rollback / privileged deletion checked against a known checkpoint
- PostgreSQL atomic token-consumption semantics
- protected action registry blocking unauthorized raw execution

## Why These Tests Matter

KNOT Guard is not tested only through success paths. The important proof path is:

```text
invalid transition proposed
-> runtime refuses execution
-> audit records why
-> protected operation does not run
```

## Gaps

The current suite does not yet include:

- multi-process PostgreSQL integration tests with a real database
- chaos tests for process crashes between token consumption and action completion
- external checkpoint signing tests
- long-running soak tests
- independent red-team review

Those belong before any high-assurance production claim.
