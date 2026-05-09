# No-Bypass Integration

KNOT Guard fails if developers expose dangerous operations directly.

The KNOT integration pattern is:

```text
raw operation stays private
-> protected action registry owns the operation
-> caller supplies intent
-> KNOT requests authority
-> KNOT executes with receipt
```

## Protected Action Registry

`ProtectedActionRegistry` keeps dangerous operations behind named protected actions.

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
        tenantId: "bank-001",
        resourceType: "payment",
      },
    };
  },
  execute(input) {
    return refunds.create(input.paymentId);
  },
});

const execution = await registry.run("refund_payment", input);
```

The caller cannot receive a raw refund function from this boundary. It receives either a denied transition or an execution result with a receipt.

## Recommended Rule

Sensitive operations should not be exported directly from application modules.

Prefer:

```text
refundPaymentProtected()
```

Avoid:

```text
refundPaymentUnsafe()
```

If an unsafe function must exist internally, keep it file-local, unexported, and covered by tests that prove public code paths go through KNOT.
