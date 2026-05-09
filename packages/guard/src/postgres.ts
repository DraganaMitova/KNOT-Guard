import { sha256Hex } from "./crypto.js";
import type {
  AuditRecord,
  AuditStore,
  ExecutionToken,
  ReplayStore,
  StoredAuditRecord,
  TokenConsumption,
} from "./types.js";

export interface PostgresQueryClient {
  query<T = unknown>(sql: string, values?: unknown[]): Promise<{ rows: T[]; rowCount?: number | null }>;
}

interface PostgresPooledClient extends PostgresQueryClient {
  release(): void;
}

interface PostgresPoolClient extends PostgresQueryClient {
  connect(): Promise<PostgresPooledClient>;
}

export interface PostgresGuardStoreConfig {
  client: PostgresQueryClient;
  auditTable?: string;
  tokenTable?: string;
}

type AuditRow = {
  id: string;
  sequence: number;
  type: AuditRecord["type"];
  actor_id: string;
  action: string;
  target: string;
  decision_id: string | null;
  token_id: string | null;
  reason: string | null;
  created_at: string | Date;
  data: Record<string, unknown> | null;
  previous_hash: string | null;
  hash: string;
};

type TokenRow = {
  token_id: string;
  consumed_at: string | Date;
  result: TokenConsumption["result"];
  reason: TokenConsumption["reason"] | null;
};

export class PostgresGuardStore implements AuditStore, ReplayStore {
  private readonly client: PostgresQueryClient;
  private readonly auditTable: string;
  private readonly tokenTable: string;

  constructor(config: PostgresGuardStoreConfig) {
    this.client = config.client;
    this.auditTable = assertIdentifier(config.auditTable ?? "knot_guard_audit_records");
    this.tokenTable = assertIdentifier(config.tokenTable ?? "knot_guard_token_consumptions");
  }

  async append(record: AuditRecord): Promise<StoredAuditRecord> {
    return this.withTransaction(async (client) => {
      await client.query("select pg_advisory_xact_lock(hashtext($1))", [this.auditTable]);

      const previous = await client.query<{ sequence: number; hash: string }>(
        `select sequence, hash from ${this.auditTable} order by sequence desc limit 1`,
      );
      const previousRecord = previous.rows[0];
      const stored: StoredAuditRecord = {
        ...record,
        sequence: Number(previousRecord?.sequence ?? 0) + 1,
        previousHash: previousRecord?.hash ?? null,
        hash: "",
      };

      stored.hash = await sha256Hex({ ...stored, hash: undefined });

      const inserted = await client.query<AuditRow>(
        `insert into ${this.auditTable}
          (id, sequence, type, actor_id, action, target, decision_id, token_id, reason, created_at, data, previous_hash, hash)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         returning *`,
        [
          stored.id,
          stored.sequence,
          stored.type,
          stored.actorId,
          stored.action,
          stored.target,
          stored.decisionId ?? null,
          stored.tokenId ?? null,
          stored.reason ?? null,
          stored.createdAt,
          stored.data ?? null,
          stored.previousHash,
          stored.hash,
        ],
      );

      return fromAuditRow(inserted.rows[0]);
    });
  }

  async consume(token: ExecutionToken, consumedAt: string): Promise<TokenConsumption> {
    const inserted = await this.client.query<TokenRow>(
      `insert into ${this.tokenTable} (token_id, consumed_at, result, reason)
       values ($1, $2, 'executed', null)
       on conflict (token_id) do nothing
       returning token_id, consumed_at, result, reason`,
      [token.id, consumedAt],
    );

    if (inserted.rows[0]) {
      return fromTokenRow(inserted.rows[0]);
    }

    return {
      tokenId: token.id,
      consumedAt,
      result: "rejected",
      reason: "token_consumed",
    };
  }

  async all(): Promise<StoredAuditRecord[]> {
    const result = await this.client.query<AuditRow>(
      `select * from ${this.auditTable} order by sequence asc`,
    );
    return result.rows.map(fromAuditRow);
  }

  async byDecision(decisionId: string): Promise<StoredAuditRecord[]> {
    const result = await this.client.query<AuditRow>(
      `select * from ${this.auditTable} where decision_id = $1 order by sequence asc`,
      [decisionId],
    );
    return result.rows.map(fromAuditRow);
  }

  async byToken(tokenId: string): Promise<StoredAuditRecord[]> {
    const result = await this.client.query<AuditRow>(
      `select * from ${this.auditTable} where token_id = $1 order by sequence asc`,
      [tokenId],
    );
    return result.rows.map(fromAuditRow);
  }

  async getConsumption(tokenId: string): Promise<TokenConsumption | undefined> {
    const result = await this.client.query<TokenRow>(
      `select token_id, consumed_at, result, reason from ${this.tokenTable} where token_id = $1`,
      [tokenId],
    );
    return result.rows[0] ? fromTokenRow(result.rows[0]) : undefined;
  }

  private async withTransaction<T>(
    operation: (client: PostgresQueryClient) => Promise<T>,
  ): Promise<T> {
    if (isPostgresPoolClient(this.client)) {
      const pooledClient = await this.client.connect();

      try {
        await pooledClient.query("begin");
        const result = await operation(pooledClient);
        await pooledClient.query("commit");
        return result;
      } catch (error) {
        await pooledClient.query("rollback");
        throw error;
      } finally {
        pooledClient.release();
      }
    }

    await this.client.query("begin");

    try {
      const result = await operation(this.client);
      await this.client.query("commit");
      return result;
    } catch (error) {
      await this.client.query("rollback");
      throw error;
    }
  }

  static schema(config: Pick<PostgresGuardStoreConfig, "auditTable" | "tokenTable"> = {}): string {
    const auditTable = assertIdentifier(config.auditTable ?? "knot_guard_audit_records");
    const tokenTable = assertIdentifier(config.tokenTable ?? "knot_guard_token_consumptions");

    return `
create table if not exists ${auditTable} (
  id text primary key,
  sequence bigint not null unique,
  type text not null,
  actor_id text not null,
  action text not null,
  target text not null,
  decision_id text,
  token_id text,
  reason text,
  created_at timestamptz not null,
  data jsonb,
  previous_hash text,
  hash text not null unique
);

create index if not exists ${auditTable}_decision_id_idx on ${auditTable} (decision_id);
create index if not exists ${auditTable}_token_id_idx on ${auditTable} (token_id);

create table if not exists ${tokenTable} (
  token_id text primary key,
  consumed_at timestamptz not null,
  result text not null,
  reason text
);
`;
  }
}

function fromAuditRow(row: AuditRow): StoredAuditRecord {
  return {
    id: row.id,
    sequence: Number(row.sequence),
    type: row.type,
    actorId: row.actor_id,
    action: row.action,
    target: row.target,
    decisionId: row.decision_id ?? undefined,
    tokenId: row.token_id ?? undefined,
    reason: row.reason ?? undefined,
    createdAt: fromPostgresTimestamp(row.created_at),
    data: row.data ?? undefined,
    previousHash: row.previous_hash,
    hash: row.hash,
  };
}

function fromTokenRow(row: TokenRow): TokenConsumption {
  return {
    tokenId: row.token_id,
    consumedAt: fromPostgresTimestamp(row.consumed_at),
    result: row.result,
    reason: row.reason ?? undefined,
  };
}

function assertIdentifier(identifier: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe PostgreSQL identifier: ${identifier}`);
  }

  return identifier;
}

function isPostgresPoolClient(client: PostgresQueryClient): client is PostgresPoolClient {
  return typeof (client as Partial<PostgresPoolClient>).connect === "function";
}

function fromPostgresTimestamp(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}
