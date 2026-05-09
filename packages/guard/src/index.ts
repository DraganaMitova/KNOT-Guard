export { InMemoryAuditLog } from "./audit.js";
export { canonicalJson, sha256Hex } from "./crypto.js";
export { KnotGuard } from "./guard.js";
export { ReplayProtection } from "./replay.js";
export { bindScope, scopeMatches } from "./scope.js";
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
  ExecutionToken,
  GuardConfig,
  Policy,
  Scope,
  StoredAuditRecord,
  TokenConsumption,
} from "./types.js";
