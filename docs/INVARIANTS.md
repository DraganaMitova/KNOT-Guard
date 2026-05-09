# Runtime Invariants

KNOT Guard is built around one core invariant:

```text
request is not authority
authority is not execution
execution is not proof
logs are not audit
```

## Execution Invariant

A protected action may execute only if all of these conditions hold:

1. an authority decision exists
2. the decision state is `allow`
3. actor, action, target, scope, and policy version match the execution token
4. the token has not expired
5. the token has not been consumed
6. token consumption is recorded before the protected operation runs
7. audit append succeeds before the protected operation runs
8. execution completion is appended to the audit chain
9. a transition receipt can identify the decision, token, target, and audit hashes

## Boundary Invariants

KNOT Guard does not pretend one proof covers every threat.

- Audit hash chains prove record continuity, not storage honesty.
- Checkpoints prove the observed chain has not rolled back from a known head.
- Replay stores prove token uniqueness only within their atomic consistency boundary.
- Registries prove protected call paths only when raw operations are not exported.

Each proof has a boundary. Each boundary must be named.

## Transition Receipt

`executeWithReceipt` returns a receipt for every successful protected transition:

```ts
const execution = await knot.executeWithReceipt(decision, async () => {
  return await refunds.create(paymentId);
});

console.log(execution.receipt.executionAuditHash);
```

The receipt is designed to make a sensitive action referable after the fact. A caller can store the receipt next to its business record, while KNOT Guard stores the audit chain.
