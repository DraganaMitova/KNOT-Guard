import { ProtectedActionRegistry } from "@knot/guard";

export function registerRefundPayment(knot, options = {}) {
  const refunds = options.refunds ?? new Map();
  const registry = options.registry ?? new ProtectedActionRegistry(knot);

  registry.register({
    action: "refund_payment",
    buildRequest(input) {
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
      return refundPaymentRaw(refunds, input.paymentId);
    },
  });

  return registry;
}

function refundPaymentRaw(refunds, paymentId) {
  const refund = {
    id: `refund_${refunds.size + 1}`,
    paymentId,
    createdAt: new Date().toISOString(),
  };

  refunds.set(refund.id, refund);
  return refund;
}
