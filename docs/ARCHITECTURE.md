# Architecture

KNOT Guard separates sensitive execution into explicit stages.

```mermaid
flowchart LR
  Raw["Raw Operation Exposed Directly"] -->|"bypass: outside governed boundary"| Unsafe["Ungoverned State Change"]
  Caller["Caller or AI Tool"] --> Registry["Protected Action Registry"]
  Registry --> Request["Authority Request"]
  Request --> Policy["Policy, Scope, Risk"]
  Policy --> Decision{"Decision"}
  Decision -->|"deny"| Denied["Denied Audit Record"]
  Decision -->|"hold"| Held["Review Hold Audit Record"]
  Decision -->|"allow"| Token["One-Use Execution Token"]
  Token --> Consume["Atomic Token Consumption"]
  Consume --> Execute["Protected Operation"]
  Execute --> Audit["Tamper-Evident Audit Chain"]
  Audit --> Receipt["Transition Receipt"]
```

## Boundaries

- Policy decides whether authority may exist.
- Tokens bind authority to one actor, action, target, scope, and policy version.
- Replay storage decides whether this token has already been used.
- Audit storage records the transition path.
- Receipts make successful transitions externally referable.

## Why This Is Different From Scanning

Scanners tell you something may be unsafe.

KNOT Guard sits in the execution path and refuses invalid state transitions.
