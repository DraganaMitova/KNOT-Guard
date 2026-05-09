import assert from "node:assert/strict";
import test from "node:test";
import {
  KnotGuard,
  KnotGuardError,
  PostgresGuardStore,
  ProtectedActionRegistry,
  verifyAuditChain,
} from "../dist/index.js";

const basePolicy = {
  action: {
    name: "refund_payment",
    risk: "medium",
    requiredRoles: ["finance_admin"],
    requiresReason: true,
  },
  allowedScopes: [{ tenantId: "bank-001", resourceType: "payment", targetId: "*" }],
};

function createGuard(overrides = {}) {
  return new KnotGuard({
    policies: [basePolicy],
    tokenTtlMs: 1_000,
    ...overrides,
  });
}

function request(overrides = {}) {
  return {
    actor: { id: "ava", roles: ["finance_admin"] },
    action: "refund_payment",
    target: "pay_001",
    reason: "Duplicate charge",
    scope: { tenantId: "bank-001", resourceType: "payment" },
    ...overrides,
  };
}

test("allows a scoped action and consumes the execution token once", async () => {
  const knot = createGuard();
  const decision = await knot.requestAuthority(request());

  assert.equal(decision.state, "allow");
  assert.ok(decision.token);

  const result = await knot.execute(decision, () => "refunded");
  assert.equal(result, "refunded");

  await assert.rejects(
    () => knot.execute(decision, () => "replayed"),
    (error) => error instanceof KnotGuardError && error.reason === "token_consumed",
  );
});

test("returns a transition receipt for successful execution", async () => {
  const knot = createGuard({ policyVersion: "policy-v1" });
  const decision = await knot.requestAuthority(request());
  const execution = await knot.executeWithReceipt(decision, () => ({ ok: true }));

  assert.deepEqual(execution.result, { ok: true });
  assert.equal(execution.receipt.decisionId, decision.id);
  assert.equal(execution.receipt.tokenId, decision.token.id);
  assert.equal(execution.receipt.actorId, "ava");
  assert.equal(execution.receipt.action, "refund_payment");
  assert.equal(execution.receipt.target, "pay_001");
  assert.equal(execution.receipt.policyVersion, "policy-v1");
  assert.match(execution.receipt.tokenConsumedAuditHash, /^[a-f0-9]{64}$/);
  assert.match(execution.receipt.executionAuditHash, /^[a-f0-9]{64}$/);
});

test("denies wrong actor role before token minting", async () => {
  const knot = createGuard();
  const decision = await knot.requestAuthority(
    request({ actor: { id: "leo", roles: ["support_agent"] } }),
  );

  assert.equal(decision.state, "deny");
  assert.equal(decision.denialReason, "actor_not_allowed");
  assert.equal(decision.token, undefined);
});

test("denies scope mismatches", async () => {
  const knot = createGuard();
  const decision = await knot.requestAuthority(
    request({ scope: { tenantId: "bank-999", resourceType: "payment" } }),
  );

  assert.equal(decision.state, "deny");
  assert.equal(decision.denialReason, "scope_mismatch");
});

test("holds critical actions for review", async () => {
  const knot = new KnotGuard({
    policies: [
      {
        action: {
          name: "delete_account",
          risk: "critical",
          requiredRoles: ["security_admin"],
          requiresReason: true,
        },
        allowedScopes: [{ tenantId: "bank-001", resourceType: "account", targetId: "*" }],
      },
    ],
  });

  const decision = await knot.requestAuthority({
    actor: { id: "mira", roles: ["security_admin"] },
    action: "delete_account",
    target: "acct_001",
    reason: "Fraud closure",
    scope: { tenantId: "bank-001", resourceType: "account" },
  });

  assert.equal(decision.state, "hold");
  assert.equal(decision.reviewReason, "critical_risk");
});

test("rejects tampered authority decisions", async () => {
  const knot = createGuard();
  const decision = await knot.requestAuthority(request());

  const tampered = {
    ...decision,
    request: {
      ...decision.request,
      target: "pay_intruder",
    },
  };

  await assert.rejects(
    () => knot.execute(tampered, () => "bad"),
    (error) => error instanceof KnotGuardError && error.reason === "token_scope_mismatch",
  );
});

test("writes a tamper-evident audit hash chain", async () => {
  const knot = createGuard();
  const decision = await knot.requestAuthority(request());
  await knot.execute(decision, () => "ok");

  const records = await knot.auditRecords();

  assert.equal(records.length, 4);
  assert.equal(records[0].previousHash, null);
  assert.equal(records[1].previousHash, records[0].hash);
  assert.equal(records[2].previousHash, records[1].hash);
  assert.equal(records[3].previousHash, records[2].hash);
  assert.match(records[3].hash, /^[a-f0-9]{64}$/);
});

test("allows only one winner when the same token is executed concurrently", async () => {
  const knot = createGuard();
  const decision = await knot.requestAuthority(request());

  const attempts = await Promise.allSettled(
    Array.from({ length: 16 }, () => knot.execute(decision, () => "winner")),
  );

  const winners = attempts.filter((attempt) => attempt.status === "fulfilled");
  const blocked = attempts.filter((attempt) => attempt.status === "rejected");

  assert.equal(winners.length, 1);
  assert.equal(blocked.length, 15);
  assert.ok(blocked.every((attempt) => attempt.reason.reason === "token_consumed"));
});

test("rejects expired execution tokens", async () => {
  let now = new Date("2026-01-01T00:00:00.000Z");
  const knot = createGuard({ now: () => now, tokenTtlMs: 10 });
  const decision = await knot.requestAuthority(request());

  now = new Date("2026-01-01T00:00:00.011Z");

  await assert.rejects(
    () => knot.execute(decision, () => "late"),
    (error) => error instanceof KnotGuardError && error.reason === "token_expired",
  );
});

test("denies requests that omit required reasons", async () => {
  const knot = createGuard();
  const decision = await knot.requestAuthority(request({ reason: undefined }));

  assert.equal(decision.state, "deny");
  assert.equal(decision.denialReason, "missing_reason");
});

test("does not run the protected operation when audit append fails before execution", async () => {
  let operationRan = false;
  const auditStore = {
    async append(record) {
      if (record.type === "token_consumed") {
        throw new Error("audit store unavailable");
      }

      return {
        ...record,
        sequence: 1,
        previousHash: null,
        hash: "0".repeat(64),
      };
    },
    async all() {
      return [];
    },
    async byDecision() {
      return [];
    },
    async byToken() {
      return [];
    },
  };
  const knot = createGuard({ auditStore });
  const decision = await knot.requestAuthority(request());

  await assert.rejects(
    () => knot.execute(decision, () => {
      operationRan = true;
    }),
    /audit store unavailable/,
  );

  assert.equal(operationRan, false);
});

test("binds execution tokens to a policy version", async () => {
  const knot = createGuard({ policyVersion: "policy-2026-05-09" });
  const decision = await knot.requestAuthority(request());

  assert.equal(decision.policyVersion, "policy-2026-05-09");
  assert.equal(decision.token.policyVersion, "policy-2026-05-09");

  await assert.rejects(
    () => knot.execute({ ...decision, policyVersion: "policy-drifted" }, () => "bad"),
    (error) => error instanceof KnotGuardError && error.reason === "token_scope_mismatch",
  );
});

test("verifies valid audit chains and rejects tampered chains", async () => {
  const knot = createGuard();
  const decision = await knot.requestAuthority(request());
  await knot.execute(decision, () => "ok");

  const records = await knot.auditRecords();
  const valid = await verifyAuditChain(records);

  assert.equal(valid.valid, true);
  assert.equal(valid.recordsChecked, 4);

  const tampered = records.map((record) => ({ ...record }));
  tampered[1].target = "pay_tampered";

  const invalid = await verifyAuditChain(tampered);

  assert.equal(invalid.valid, false);
  assert.equal(invalid.failures.some((failure) => failure.reason === "hash_mismatch"), true);
});

test("detects rollback or privileged deletion when checked against a known checkpoint", async () => {
  const knot = createGuard();
  const firstDecision = await knot.requestAuthority(request({ target: "pay_001" }));
  await knot.execute(firstDecision, () => "first");
  const secondDecision = await knot.requestAuthority(request({ target: "pay_002" }));
  await knot.execute(secondDecision, () => "second");

  const records = await knot.auditRecords();
  const checkpoint = await verifyAuditChain(records);
  const rolledBack = records.slice(0, 4);
  const verifiedRollback = await verifyAuditChain(rolledBack, {
    expectedHeadHash: checkpoint.headHash,
    expectedRecordCount: records.length,
  });

  assert.equal(checkpoint.valid, true);
  assert.equal(verifiedRollback.valid, false);
  assert.equal(
    verifiedRollback.failures.some((failure) => failure.reason === "checkpoint_mismatch"),
    true,
  );
});

test("runs dangerous operations through a protected action registry", async () => {
  const knot = createGuard();
  const registry = new ProtectedActionRegistry(knot);
  const rawRefunds = [];

  registry.register({
    action: "refund_payment",
    buildRequest(input) {
      return request({
        actor: input.actor,
        target: input.paymentId,
        reason: input.reason,
        scope: { tenantId: "bank-001", resourceType: "payment" },
      });
    },
    execute(input) {
      rawRefunds.push(input.paymentId);
      return { refundId: `refund_${rawRefunds.length}` };
    },
  });

  const allowed = await registry.run("refund_payment", {
    actor: { id: "ava", roles: ["finance_admin"] },
    paymentId: "pay_001",
    reason: "Duplicate charge",
  });

  assert.deepEqual(allowed.result, { refundId: "refund_1" });
  assert.equal(allowed.receipt.action, "refund_payment");
  assert.equal(rawRefunds.length, 1);

  await assert.rejects(
    () => registry.run("refund_payment", {
      actor: { id: "leo", roles: ["support_agent"] },
      paymentId: "pay_002",
      reason: "Trying to bypass authority",
    }),
    (error) => error instanceof KnotGuardError && error.reason === "actor_not_allowed",
  );
  assert.equal(rawRefunds.length, 1);
});

test("PostgresGuardStore rejects replay through atomic token insert semantics", async () => {
  const consumed = new Set();
  const queries = [];
  const client = {
    async query(sql, values = []) {
      queries.push(sql);

      if (sql.includes("insert into knot_guard_token_consumptions")) {
        const tokenId = values[0];

        if (consumed.has(tokenId)) {
          return { rows: [], rowCount: 0 };
        }

        consumed.add(tokenId);
        return {
          rows: [{
            token_id: tokenId,
            consumed_at: values[1],
            result: "executed",
            reason: null,
          }],
          rowCount: 1,
        };
      }

      return { rows: [] };
    },
  };
  const store = new PostgresGuardStore({ client });
  const token = {
    id: "tok_1",
    decisionId: "dec_1",
    actorId: "ava",
    action: "refund_payment",
    target: "pay_001",
    scope: { tenantId: "bank-001" },
    issuedAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-01-01T00:01:00.000Z",
  };

  const first = await store.consume(token, "2026-01-01T00:00:01.000Z");
  const second = await store.consume(token, "2026-01-01T00:00:02.000Z");

  assert.equal(first.result, "executed");
  assert.equal(second.result, "rejected");
  assert.equal(second.reason, "token_consumed");
  assert.equal(queries.some((sql) => sql.includes("on conflict (token_id) do nothing")), true);
});
