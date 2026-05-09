# Benchmarks

KNOT Guard includes a small benchmark harness for the authority and execution path.

Run:

```bash
npm run benchmark
```

Or choose an iteration count:

```bash
KNOT_BENCHMARK_ITERATIONS=50000 npm run benchmark
```

The benchmark measures:

- authority request evaluation
- role and scope validation
- one-use token minting
- token consumption
- SHA-256 audit-chain writes
- protected no-op execution

## Important Notes

This is a local in-memory benchmark. It does not represent production latency with a database-backed replay store or audit store.

Production benchmarks should be published separately for:

- PostgreSQL adapter
- Redis replay store
- JSONL audit store
- cloud object storage audit export
- multi-worker contention tests
