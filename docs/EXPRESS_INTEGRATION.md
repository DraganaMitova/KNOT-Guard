# Express Integration

This is the recommended Express shape until a dedicated `@knot/guard-express` package exists.

The important rule is that the route calls a protected action name, not a raw dangerous function.

```ts
import express from "express";
import { KnotGuard, ProtectedActionRegistry } from "@knot/guard";

const app = express();
app.use(express.json());

const knot = new KnotGuard({
  policyVersion: "bank-admin-v0.1",
  policies: [
    {
      action: {
        name: "refund_payment",
        risk: "medium",
        requiredRoles: ["finance_admin"],
        requiresReason: true,
      },
      allowedScopes: [
        { tenantId: "bank-001", resourceType: "payment", targetId: "*" },
      ],
    },
  ],
});

const registry = new ProtectedActionRegistry(knot);

async function refundPaymentRaw(paymentId: string) {
  return payments.refund(paymentId);
}

registry.register({
  action: "refund_payment",
  buildRequest(input: {
    actor: { id: string; roles: string[] };
    paymentId: string;
    reason: string;
  }) {
    return {
      actor: input.actor,
      action: "refund_payment",
      target: input.paymentId,
      reason: input.reason,
      scope: {
        tenantId: "bank-001",
        resourceType: "payment",
        targetId: input.paymentId,
      },
    };
  },
  execute(input) {
    return refundPaymentRaw(input.paymentId);
  },
});

app.post("/refund", async (req, res, next) => {
  try {
    const execution = await registry.run("refund_payment", {
      actor: req.body.actor,
      paymentId: req.body.paymentId,
      reason: req.body.reason,
    });

    res.status(200).json(execution);
  } catch (error) {
    if (error instanceof Error && error.name === "KnotGuardError") {
      res.status(403).json({ error: error.message });
      return;
    }

    next(error);
  }
});

app.get("/audit", async (_req, res) => {
  res.status(200).json(await knot.auditRecords());
});
```

## What To Keep True

- Raw dangerous operations stay private to the module that registers protected actions.
- Routes, jobs, and agent tools call `registry.run(...)`.
- Successful responses include the transition receipt from `executeWithReceipt`.
- Denied and held decisions are returned as governed failures, not bypassed with direct calls.
