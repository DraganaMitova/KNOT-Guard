import { performance } from "node:perf_hooks";
import { KnotGuard } from "../dist/index.js";

const iterations = Number.parseInt(process.env.KNOT_BENCHMARK_ITERATIONS ?? "10000", 10);

const knot = new KnotGuard({
  policies: [
    {
      action: {
        name: "refund_payment",
        risk: "medium",
        requiredRoles: ["finance_admin"],
        requiresReason: true,
      },
      allowedScopes: [{ tenantId: "bank-001", resourceType: "payment", targetId: "*" }],
    },
  ],
});

const startedAt = performance.now();

for (let index = 0; index < iterations; index += 1) {
  const decision = await knot.requestAuthority({
    actor: { id: "ava", roles: ["finance_admin"] },
    action: "refund_payment",
    target: `pay_${index}`,
    reason: "Benchmark authorization path",
    scope: { tenantId: "bank-001", resourceType: "payment" },
  });

  await knot.execute(decision, () => undefined);
}

const durationMs = performance.now() - startedAt;
const operationsPerSecond = Math.round((iterations / durationMs) * 1000);

console.log(JSON.stringify({
  iterations,
  durationMs: Number(durationMs.toFixed(2)),
  operationsPerSecond,
  notes: "In-memory policy checks, replay protection, token consumption, and SHA-256 audit-chain writes.",
}, null, 2));
