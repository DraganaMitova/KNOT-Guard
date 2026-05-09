import { KnotGuard } from "../src/index.js";

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
  actor: { id: "user_123", roles: ["finance_admin"] },
  action: "refund_payment",
  target: "payment_456",
  reason: "Duplicate charge confirmed by support case SUP-19",
  scope: { tenantId: "bank-001", resourceType: "payment" },
});

if (decision.state === "allow") {
  await knot.execute(decision, async () => {
    console.log("Refund executed");
  });
}

console.log(knot.auditRecords());
