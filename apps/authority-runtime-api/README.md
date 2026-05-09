# KNOT Authority Runtime API

Runnable backend proof for KNOT Guard.

Start it:

```bash
npm run build
npm --workspace @knot/authority-runtime-api start
```

Allowed transition:

```bash
curl -s http://127.0.0.1:4317/refund \
  -H 'content-type: application/json' \
  -d '{
    "actor": { "id": "ava", "roles": ["finance_admin"] },
    "paymentId": "pay_8421",
    "reason": "Duplicate charge"
  }'
```

Denied transition:

```bash
curl -s http://127.0.0.1:4317/refund \
  -H 'content-type: application/json' \
  -d '{
    "actor": { "id": "leo", "roles": ["support_agent"] },
    "paymentId": "pay_8421",
    "reason": "Trying without authority"
  }'
```

Audit export:

```bash
curl -s http://127.0.0.1:4317/audit > audit.json
npm --workspace @knot/guard exec knot-guard verify-audit audit.json
```
