# Trust And Evidence

KNOT Guard is pre-release security infrastructure. Its claims are not all equal.

This document separates implemented evidence from claims that still need independent review. The companion [assurance boundaries](ASSURANCE.md) document defines which security language is allowed while the project is still pre-release.

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
| Distributed replay can be protected | `ReplayStore` interface and real PostgreSQL concurrency integration test | Self-tested |
| Audit records are tamper-evident | SHA-256 hash chain and verifier tests | Self-tested |
| Rollback can be detected | verifier supports expected head hash and record count | Self-tested |
| Rollback is prevented | requires external checkpoint authority | Not yet proven |
| Privileged DB tampering is prevented | requires immutable storage or external checkpoints | Not yet proven |
| Policy drift is blocked | policy-version binding test | Self-tested |
| Bypass can be reduced by architecture | `ProtectedActionRegistry` pattern and Express route proof | Self-tested |
| Bypass is impossible | impossible if raw operations are exposed elsewhere | Not yet proven |
| Install hooks are absent | package safety script and CI check | Self-tested |
| Weak random fallback is avoided | default id generation requires `crypto.randomUUID()` | Implemented |
| Signed releases are available | not implemented | Not yet proven |
| Reproducible builds are available | package dry run exists, reproducible build proof not implemented | Not yet proven |
| Enterprise readiness | no independent audit or large deployments yet | Not yet proven |

## Current Trust Statement

KNOT Guard is an opinionated authority-governed execution runtime with a growing evidence surface. It is not yet independently audited, formally verified, enterprise-certified, or battle-tested at scale.

## What Would Upgrade Trust

- independent security audit
- public adversarial review
- external checkpoint signing example
- production case study
- tagged release with checksums and SBOM
- comparative benchmarks against direct execution and other authorization patterns
