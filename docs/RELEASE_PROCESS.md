# Release Process

KNOT Guard does not yet have a production release.

This is the required process before a tagged release is described as ready for production evaluation.

## Required Checks

```bash
npm ci
npm run build
npm test
npm audit --audit-level=high
npm run security:package
npm run assurance:language
npm run benchmark
npm --workspace @knot/guard pack --dry-run
```

## Release Evidence

Each release should publish:

- changelog entry
- benchmark result
- dependency audit result
- package dry-run output
- known security limits
- release artifact checksum
- SBOM, once generation is added

## Signing And Provenance

Not yet implemented:

- signed Git tags
- signed release artifacts
- SLSA provenance
- npm provenance
- SBOM publication

These are required before claiming mature supply-chain trust.
