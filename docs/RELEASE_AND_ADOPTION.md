# Release And Adoption Status

## Current Status

KNOT Guard is pre-release software.

This repository currently proves:

- the product architecture
- the authority-governed execution API
- replay prevention inside one process
- scope-bound token execution
- concurrent in-process replay-race rejection
- tamper-evident audit chaining
- audit-chain verifier CLI
- PostgreSQL audit/replay adapter shape
- local benchmarkability

It does not yet claim:

- production adoption
- independent audit
- enterprise support
- formal verification
- production-certified database adapters
- compliance certification

## Release Criteria

A first production candidate should include:

- versioned `0.1.0` release tag
- PostgreSQL audit/replay adapter
- external audit-chain verifier
- policy version binding
- idempotency guidance for protected actions
- documented migration path
- example Express middleware
- signed release artifact checksums

## Adoption Evidence To Collect

When real users begin evaluating KNOT Guard, track:

- protected action count
- replay attempts blocked
- scope violations blocked
- median authority-check latency
- audit-chain verification results
- integration time for new backend teams

Until then, positioning should say "security architecture preview" or "pre-release SDK," not "mature security platform."
