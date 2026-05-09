# Supply-Chain Posture

KNOT Guard's current supply-chain strategy is conservative: keep the dependency tree small, lock installs, scan dependency changes, and avoid accidental open-source relicensing.

## Current Practices

- `package-lock.json` is committed.
- CI uses `npm ci`.
- The package is marked `private` and `UNLICENSED`.
- The SDK package is marked `private`.
- Dependency Review blocks high-severity dependency changes and disallowed copyleft licenses.
- `npm audit --audit-level=high` runs in CI.

## Dependency Policy

New runtime dependencies should be avoided unless they remove meaningful security risk or integration complexity.

Before adding a dependency, check:

- maintenance status
- license
- transitive dependency count
- security advisories
- whether the feature can be implemented with platform APIs

## Future Hardening

- signed release artifacts
- SLSA provenance
- npm provenance if a commercial package is ever published
- SBOM generation
- pinned GitHub Action SHAs
- dependency update automation with review gates
