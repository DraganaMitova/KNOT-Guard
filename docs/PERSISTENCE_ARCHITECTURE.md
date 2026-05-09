# Persistence And Audit Architecture

The default SDK uses `InMemoryAuditLog`. This is useful for demos, tests, and local development. It is not the correct persistence layer for production.

## Production Requirements

A production adapter must provide:

- append-only audit records
- atomic token consumption
- unique token id constraints
- durable storage across process restarts
- ordered sequence assignment
- hash-chain preservation
- independent backup or replication

## Replay Protection

Single-process replay protection is handled in memory today. In a distributed deployment, token consumption must be persisted with an atomic conditional insert:

```sql
insert into token_consumptions (token_id, consumed_at)
values (?, ?)
on conflict (token_id) do nothing;
```

Execution may proceed only if the insert succeeds.

## Audit Append

Audit append should happen before and after execution:

```text
authority_requested
authority_allowed | authority_denied | authority_held
token_consumed
execution_completed | execution_rejected
```

For production, `token_consumed` and the protected action should be wrapped in the narrowest transaction the application can support. If the protected action cannot be transactional, the audit record should include an external operation id so reconciliation can detect partial completion.

## Recommended Adapter Interface

The SDK exposes an `AuditStore` interface:

```ts
interface AuditStore {
  append(record: AuditRecord): Promise<StoredAuditRecord>;
  all(): Promise<StoredAuditRecord[]>;
  byDecision(decisionId: string): Promise<StoredAuditRecord[]>;
  byToken(tokenId: string): Promise<StoredAuditRecord[]>;
}
```

The next production adapters should target:

- PostgreSQL
- SQLite for embedded systems
- append-only JSONL for local agent runtimes
- cloud object storage for immutable audit exports

## Operational Notes

KNOT Guard should be treated as a policy and execution boundary. It should be deployed close to the action implementation, not only in a frontend, gateway, or admin panel.
