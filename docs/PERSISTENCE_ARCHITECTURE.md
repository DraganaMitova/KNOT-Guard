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

## Recommended Adapter Interfaces

The SDK exposes `AuditStore` and `ReplayStore` interfaces:

```ts
interface AuditStore {
  append(record: AuditRecord): Promise<StoredAuditRecord>;
  all(): Promise<StoredAuditRecord[]>;
  byDecision(decisionId: string): Promise<StoredAuditRecord[]>;
  byToken(tokenId: string): Promise<StoredAuditRecord[]>;
}

interface ReplayStore {
  consume(token: ExecutionToken, consumedAt: string): Promise<TokenConsumption>;
  getConsumption(tokenId: string): Promise<TokenConsumption | undefined>;
}
```

The current SDK includes a `PostgresGuardStore` adapter shape that implements both interfaces. It uses `insert ... on conflict (token_id) do nothing` for atomic token consumption and an advisory transaction lock for ordered audit-chain appends.

Use its schema helper as a starting point:

```ts
PostgresGuardStore.schema();
```

Then wire a checked-out PostgreSQL client:

```ts
const store = new PostgresGuardStore({ client });
const knot = new KnotGuard({
  policies,
  auditStore: store,
  replayStore: store,
});
```

## Real Integration Proof

The package includes a PostgreSQL integration test that starts a temporary embedded PostgreSQL server by default. If you need to run the same proof against an external test database, provide `KNOT_POSTGRES_TEST_URL`.

Run it against a real test database with:

```bash
KNOT_POSTGRES_TEST_URL=postgres://user:password@127.0.0.1:5432/knot_guard_test npm --workspace @knot/guard test
```

The test creates isolated audit and token tables, runs concurrent executions against one token, asserts that exactly one execution wins, checks replay rejection for the rest, and verifies the resulting audit chain.

Do not treat this as a production-certified database adapter claim. It is an integration proof for PostgreSQL behavior under the tested concurrency path.

Future production adapters should also target:

- SQLite for embedded systems
- append-only JSONL for local agent runtimes
- cloud object storage for immutable audit exports

## Operational Notes

KNOT Guard should be treated as a policy and execution boundary. It should be deployed close to the action implementation, not only in a frontend, gateway, or admin panel.
