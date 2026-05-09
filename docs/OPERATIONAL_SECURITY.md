# Operational Security

KNOT Guard treats repository operations as part of the product's security posture. A security runtime is not credible if its build and release path is casual.

## Current Controls

- locked dependency installation with `npm ci`
- CI build and runtime test workflow
- benchmark smoke workflow
- scheduled `npm audit`
- CodeQL JavaScript/TypeScript scanning
- dependency review on pull requests
- restricted default GitHub Action permissions
- disabled persisted checkout credentials
- PR template with security-impact checklist
- private vulnerability reporting policy

## Recommended Repository Settings

Enable these settings in GitHub before treating a branch as release-ready:

- require pull requests before merging into `main`
- require status checks: `CI`, `Security`, `Dependency Review`
- require branch to be up to date before merge
- block force pushes to `main`
- require signed commits or vigilant mode
- enable Dependabot alerts
- enable secret scanning
- enable push protection for secrets
- require at least one approving review

## Release Guardrails

Before a release:

- run `npm ci`
- run `npm run build`
- run `npm test`
- run `npm run benchmark`
- review dependency diff
- update `CHANGELOG.md`
- tag the release
- attach benchmark and security notes to the release

## Known Gaps

- no independent security audit yet
- no signed release artifacts yet
- no SLSA provenance yet
- no production persistence adapter yet
- no adversarial replay-race load test beyond the local concurrency test
