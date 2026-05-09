# Security Review Status

KNOT Guard has not completed an independent third-party security audit.

## Current Review Surface

Available for review:

- source code
- threat model
- security limits
- adversarial test suite
- audit-chain verifier
- PostgreSQL adapter with real concurrency integration proof
- CI and dependency scanning workflows

## Known Unreviewed Areas

- cryptographic design depth
- crash recovery around real database contention and external side effects
- crash recovery around external side effects
- rollback resistance with external checkpoints
- developer bypass resistance in large applications
- operational failure modes

## Review Questions

Security reviewers should focus on:

- Can a token be reused under concurrency?
- Can action, target, actor, scope, or policy version drift after authority is granted?
- Can a protected operation run if audit append fails?
- Can audit rollback be detected against a checkpoint?
- Can a developer accidentally expose a raw dangerous operation?
- What happens when the process crashes after token consumption but before completion audit?

## Project Stance

KNOT Guard should not be marketed as a mature trustworthy security platform until independent review, production adapters, and operational evidence exist.
