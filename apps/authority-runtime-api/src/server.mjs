import { createServer } from "node:http";
import { KnotGuard } from "@knot/guard";

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

const refunds = new Map();

const server = createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/refund") {
      const body = await readJson(request);
      const decision = await knot.requestAuthority({
        actor: body.actor,
        action: "refund_payment",
        target: body.paymentId,
        reason: body.reason,
        scope: { tenantId: "bank-001", resourceType: "payment" },
      });

      if (decision.state !== "allow") {
        return sendJson(response, 403, { decision });
      }

      const execution = await knot.executeWithReceipt(decision, async () => {
        const refund = {
          id: `refund_${refunds.size + 1}`,
          paymentId: body.paymentId,
          createdAt: new Date().toISOString(),
        };
        refunds.set(refund.id, refund);
        return refund;
      });

      return sendJson(response, 200, execution);
    }

    if (request.method === "GET" && request.url === "/audit") {
      return sendJson(response, 200, await knot.auditRecords());
    }

    return sendJson(response, 404, { error: "not_found" });
  } catch (error) {
    return sendJson(response, 500, { error: error.message });
  }
});

server.listen(4317, "127.0.0.1", () => {
  console.log("KNOT Authority Runtime API listening on http://127.0.0.1:4317");
});

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "content-type": "application/json" });
  response.end(JSON.stringify(payload, null, 2));
}
