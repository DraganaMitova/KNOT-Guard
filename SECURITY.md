# Security Policy

KNOT Guard is pre-release security infrastructure licensed for open reciprocal review under AGPL-3.0-only. Please do not publish suspected vulnerabilities publicly before Dragana Mitova has had a reasonable chance to review them.

## Reporting A Vulnerability

Report security issues privately to the repository owner. If GitHub private vulnerability reporting is enabled for the repository, use that path first. Otherwise contact Dragana Mitova directly before publishing details.

Include:

- affected commit or branch
- reproduction steps
- expected impact
- whether token replay, scope bypass, audit suppression, or policy bypass is involved
- any logs or proof-of-concept code

## Supported Versions

| Version | Supported |
| --- | --- |
| `main` prototype | No production support |
| `security-readiness-hardening` | Security review branch |

## Current Security Posture

This project currently provides local SDK guarantees and documented production requirements. It has not yet completed independent audit, formal verification, or production adapter review.

## Advisory Process

For confirmed vulnerabilities:

- create a private advisory record
- identify affected branches and releases
- add a regression test when practical
- patch on the supported branch
- publish advisory notes after a fix or mitigation is available
- credit external reporters unless they request otherwise
