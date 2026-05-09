export { InMemoryAuditLog } from "./audit.js";
export { KnotGuard } from "./guard.js";
export { ReplayProtection } from "./replay.js";
export { bindScope, scopeMatches } from "./scope.js";
export { KnotGuardError } from "./types.js";
export type {
  Action,
  Actor,
  AuditRecord,
  AuthorityDecision,
  AuthorityRequest,
  DecisionState,
  DenialReason,
  ExecutionToken,
  GuardConfig,
  Policy,
  Scope,
  TokenConsumption,
} from "./types.js";
