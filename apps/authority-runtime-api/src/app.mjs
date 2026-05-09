import express from "express";
import { KnotGuard, KnotGuardError } from "@knot/guard";
import { registerRefundPayment } from "./protected-actions/refund-payment.mjs";

export function createAuthorityRuntime(options = {}) {
  const knot = options.knot ?? createKnotGuard();
  const refunds = options.refunds ?? new Map();
  const registry = options.registry ?? registerRefundPayment(knot, { refunds });
  const app = express();

  app.use(express.json());

  app.post("/refund", async (request, response, next) => {
    try {
      const execution = await registry.run("refund_payment", {
        actor: request.body.actor,
        paymentId: request.body.paymentId,
        reason: request.body.reason,
      });

      return response.status(200).json(execution);
    } catch (error) {
      if (error instanceof KnotGuardError) {
        return response.status(403).json({
          error: error.message,
          reason: error.reason,
        });
      }

      return next(error);
    }
  });

  app.get("/audit", async (_request, response, next) => {
    try {
      return response.status(200).json(await knot.auditRecords());
    } catch (error) {
      return next(error);
    }
  });

  app.use((error, _request, response, _next) => {
    response.status(500).json({ error: error.message });
  });

  return { app, knot, refunds, registry };
}

function createKnotGuard() {
  return new KnotGuard({
    policyVersion: "bank-admin-v0.1",
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
}
