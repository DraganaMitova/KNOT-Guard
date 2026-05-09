# Trust And Evidence

KNOT Guard is pre-release security infrastructure. Its claims are not all equal.

This document separates implemented evidence from claims that still need independent review.

## Evidence Levels

| Level | Meaning |
| --- | --- |
| Implemented | Code exists and local tests cover the behavior. |
| Self-tested | The repository includes tests or demos, but no independent audit. |
| Architecture | The design is documented, but production behavior depends on deployment choices. |
| Not yet proven | The project does not currently prove this claim. |

## Claims Matrix

| Claim | Current Evidence | Level |
| --- | --- | --- |
| Authority decisions are explicit | `requestAuthority` API and decision states | Implemented |
| Tokens are scope-bound | actor/action/target/scope/policy-version matching tests | Self-tested |
| Tokens are one-use in process | replay store and concurrent replay test | Self-tested |
| Distributed replay can be protected | `ReplayStore` interface and PostgreSQL `on conflict` adapter shape | Architecture |
| Audit records are tamper-evident | SHA-256 hash chain and verifier tests | Self-tested |
| Rollback can be detected | verifier supports expected head hash and record count | Self-tested |
| Rollback is prevented | requires external checkpoint authority | Not yet proven |
| Privileged DB tampering is prevented | requires immutable storage or external checkpoints | Not yet proven |
| Policy drift is blocked | policy-version binding test | Self-tested |
| Bypass is prevented by default | `ProtectedActionRegistry` pattern exists | Architecture |
| Bypass is impossible | impossible if raw operations are exposed elsewhere | Not yet proven |
| Enterprise readiness | no independent audit or large deployments yet | Not yet proven |

## Current Trust Statement

KNOT Guard is a promising authority-governed execution runtime with growing proof surfaces. It is not yet independently audited, formally verified, enterprise-certified, or battle-tested at scale.

## What Would Upgrade Trust

- independent security audit
- public adversarial review
- real PostgreSQL integration tests under concurrency
- external checkpoint signing example
- production case study
- tagged release with checksums and SBOM
- comparative benchmarks against direct execution and other authorization patterns
