import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { createAuthorityRuntime } from "../src/app.mjs";
import * as refundActions from "../src/protected-actions/refund-payment.mjs";

test("refund route executes only through the protected registry path", async () => {
  const { app, refunds } = createAuthorityRuntime();
  const server = await listen(app);

  try {
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const allowed = await postJson(`${baseUrl}/refund`, {
      actor: { id: "ava", roles: ["finance_admin"] },
      paymentId: "pay_8421",
      reason: "Duplicate charge",
    });

    assert.equal(allowed.status, 200);
    assert.equal(allowed.body.result.paymentId, "pay_8421");
    assert.equal(allowed.body.receipt.action, "refund_payment");
    assert.equal(refunds.size, 1);

    const denied = await postJson(`${baseUrl}/refund`, {
      actor: { id: "leo", roles: ["support_agent"] },
      paymentId: "pay_9000",
      reason: "Trying without authority",
    });

    assert.equal(denied.status, 403);
    assert.equal(denied.body.reason, "actor_not_allowed");
    assert.equal(refunds.size, 1);
  } finally {
    await close(server);
  }
});

test("refund protected-action module does not export the raw refund mutation", () => {
  assert.deepEqual(Object.keys(refundActions), ["registerRefundPayment"]);
});

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = createServer(app);
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  return {
    status: response.status,
    body: await response.json(),
  };
}
