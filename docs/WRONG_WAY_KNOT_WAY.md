# Wrong Way / KNOT Way

KNOT Guard protects governed transitions.

It does not protect raw operations exposed outside the governed boundary. Sensitive operations should be registered as `ProtectedAction`s and executed only through the governed runtime.

## Wrong Way

The dangerous operation is exported directly:

```ts
export async function refundPayment(paymentId: string) {
  return payments.refund(paymentId);
}
```

Any route, job, agent tool, or internal caller that reaches this function can make the state change real without KNOT authority, token consumption, or audit receipt.

## KNOT Way

The raw operation stays private to the integration boundary:

```ts
async function refundPaymentRaw(paymentId: string) {
  return payments.refund(paymentId);
}
```

Only the protected action is registered:

```ts
const registry = new ProtectedActionRegistry(knot);

registry.register({
  action: "refund_payment",
  buildRequest(input) {
    return {
      actor: input.actor,
      action: "refund_payment",
      target: input.paymentId,
      reason: input.reason,
      scope: {
        tenantId: input.tenantId,
        resourceType: "payment",
        targetId: input.paymentId,
      },
    };
  },
  execute(input) {
    return refundPaymentRaw(input.paymentId);
  },
});
```

Callers receive the governed transition API:

```ts
const execution = await registry.run("refund_payment", {
  actor,
  tenantId: "bank-001",
  paymentId: "pay_8421",
  reason: "Duplicate charge",
});
```

The caller receives either a denied transition or an execution result with a receipt. It never receives the raw refund capability.

## Boundary Diagram

```text
raw operation [do not expose]
        |
protected action registry
        |
authority request
        |
scope/risk/policy check
        |
one-use token
        |
executeWithReceipt
        |
audit hash chain
        |
receipt/verifier
```

## Integration Rule

Do not export dangerous raw operations from application modules.

If a raw operation must exist, keep it file-local, unexported, and covered by tests that prove public code paths go through `ProtectedActionRegistry`.
