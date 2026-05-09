import assert from "node:assert/strict";
import test from "node:test";
import { KnotGuard, KnotGuardError } from "../dist/index.js";

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
