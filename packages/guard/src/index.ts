export { InMemoryAuditLog } from "./audit.js";
export { canonicalJson, sha256Hex } from "./crypto.js";
export { KnotGuard } from "./guard.js";
export { PostgresGuardStore } from "./postgres.js";
export { ProtectedActionRegistry } from "./registry.js";
export { ReplayProtection } from "./replay.js";
export { bindScope, scopeMatches } from "./scope.js";
export { verifyAuditChain } from "./verify.js";
export { KnotGuardError } from "./types.js";
export type {
  Action,
  Actor,
  AuditRecord,
  AuditStore,
  AuthorityDecision,
  AuthorityRequest,
  DecisionState,
  DenialReason,
  ExecutionResult,
  ExecutionToken,
  GuardConfig,
  Policy,
  ReplayStore,
  Scope,
  StoredAuditRecord,
  TokenConsumption,
  TransitionReceipt,
} from "./types.js";
export type {
  PostgresGuardStoreConfig,
  PostgresPoolClient,
  PostgresPooledClient,
  PostgresQueryClient,
} from "./postgres.js";
export type { ProtectedAction, ProtectedOperation } from "./registry.js";
export type { AuditVerificationFailure, AuditVerificationOptions, AuditVerificationResult } from "./verify.js";
