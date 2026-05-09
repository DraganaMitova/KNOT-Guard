import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import EmbeddedPostgres from "embedded-postgres";
import { Pool } from "pg";
import {
  KnotGuard,
  KnotGuardError,
  PostgresGuardStore,
  verifyAuditChain,
} from "../dist/index.js";

const connectionString = process.env.KNOT_POSTGRES_TEST_URL;

test("PostgresGuardStore rejects replay under real PostgreSQL concurrency", async () => {
  await withPostgres(async (databaseUrl) => {
    const suffix = `${process.pid}_${Date.now()}`;
    const auditTable = `knot_guard_audit_it_${suffix}`;
    const tokenTable = `knot_guard_tokens_it_${suffix}`;
    const pool = new Pool({ connectionString: databaseUrl, max: 32 });
    pool.on("error", () => {});

    try {
      await pool.query(PostgresGuardStore.schema({ auditTable, tokenTable }));

      const store = new PostgresGuardStore({
        client: pool,
        auditTable,
        tokenTable,
      });
      const knot = new KnotGuard({
        policies: [{
          action: {
            name: "refund_payment",
            risk: "medium",
            requiredRoles: ["finance_admin"],
            requiresReason: true,
          },
          allowedScopes: [{ tenantId: "bank-001", resourceType: "payment", targetId: "*" }],
        }],
        auditStore: store,
        replayStore: store,
        tokenTtlMs: 10_000,
      });
      const decision = await knot.requestAuthority({
        actor: { id: "ava", roles: ["finance_admin"] },
        action: "refund_payment",
        target: "pay_8421",
        reason: "Duplicate charge",
        scope: { tenantId: "bank-001", resourceType: "payment" },
      });
      let rawExecutions = 0;

      const attempts = await Promise.allSettled(
        Array.from({ length: 50 }, () => knot.executeWithReceipt(decision, () => {
          rawExecutions += 1;
          return { refundId: `refund_${rawExecutions}` };
        })),
      );

      const winners = attempts.filter((attempt) => attempt.status === "fulfilled");
      const blocked = attempts.filter((attempt) => attempt.status === "rejected");
      const rejectedReasons = blocked.map((attempt) => (
        attempt.reason instanceof Error
          ? `${attempt.reason.name}:${attempt.reason.message}`
          : String(attempt.reason)
      ));

      assert.equal(winners.length, 1, rejectedReasons.join("\n"));
      assert.equal(blocked.length, 49);
      assert.equal(rawExecutions, 1);
      assert.ok(
        blocked.every((attempt) => (
          attempt.reason instanceof KnotGuardError
          && attempt.reason.reason === "token_consumed"
        )),
        rejectedReasons.join("\n"),
      );

      const consumption = await store.getConsumption(decision.token.id);
      assert.equal(consumption.result, "executed");

      const verification = await verifyAuditChain(await store.all());
      assert.equal(verification.valid, true, JSON.stringify(verification.failures, null, 2));
    } finally {
      await pool.query(`drop table if exists ${auditTable}, ${tokenTable}`);
      await pool.end();
    }
  });
});

async function withPostgres(run) {
  if (connectionString) {
    await run(connectionString);
    return;
  }

  const port = await getAvailablePort();
  const databaseDir = await mkdtemp(join(tmpdir(), "knot-guard-postgres-"));
  const postgres = new EmbeddedPostgres({
    databaseDir,
    port,
    user: "postgres",
    password: "password",
    persistent: false,
    onLog: () => {},
    onError: () => {},
  });

  await postgres.initialise();
  await postgres.start();

  try {
    await run(`postgres://postgres:password@127.0.0.1:${port}/postgres`);
  } finally {
    await postgres.stop();
  }
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(port);
      });
    });
  });
}
