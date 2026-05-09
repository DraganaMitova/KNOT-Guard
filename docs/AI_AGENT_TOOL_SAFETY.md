# AI Agent Tool Safety

KNOT Guard can sit between AI intent and real-world tool execution.

```text
AI proposes action
-> KNOT Guard requests authority
-> policy binds actor/action/target/scope
-> high-risk actions are denied or held
-> one-use token is minted
-> tool executes only through the token
-> audit chain and transition receipt prove what happened
```

## Example

An AI support agent wants to refund a payment:

```ts
const execution = await registry.run("refund_payment", {
  actor: { id: "agent-support-ai", roles: ["support_ai"] },
  paymentId,
  reason: "Customer reported duplicate charge",
});

return {
  refund: execution.result,
  receipt: execution.receipt,
};
```

The AI does not call the payment tool directly. It must pass through authority, scope binding, one-use execution, and audit.
