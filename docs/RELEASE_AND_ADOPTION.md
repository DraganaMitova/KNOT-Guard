# Release And Adoption Status

## Current Status

KNOT Guard is pre-release software.

This repository currently provides evidence for:

- the product architecture
- the authority-governed execution API
- replay prevention inside one process
- scope-bound token execution
- concurrent in-process replay-race rejection
- tamper-evident audit chaining
- audit-chain verifier CLI
- PostgreSQL audit/replay adapter with real concurrency integration proof
- wrong-way/KNOT-way and Express integration guidance
- local benchmarkability
- unsupported-claim detection in CI

It does not yet claim:

- production adoption
- independent audit
- enterprise support
- formal verification
- production-certified database adapters
- compliance certification
- reproducible builds
- signed release provenance
- public production adopters

## Release Criteria

A first production candidate should include:

- versioned `0.1.0` release tag
- PostgreSQL audit/replay adapter
- external audit-chain verifier
- policy version binding
- idempotency guidance for protected actions
- documented migration path
- dedicated Express middleware package
- signed release artifact checksums
- SBOM
- reproducible build instructions
- advisory process validated through a real report or tabletop exercise

## Adoption Evidence To Collect

When real users begin evaluating KNOT Guard, track:

- protected action count
- replay attempts blocked
- scope violations blocked
- median authority-check latency
- audit-chain verification results
- integration time for new backend teams

Until then, positioning should say "security architecture preview" or "pre-release SDK," not "mature security platform."
