export type DecisionState = "allow" | "deny" | "hold";

export type DenialReason =
  | "actor_not_allowed"
  | "scope_mismatch"
  | "risk_too_high"
  | "missing_reason"
  | "token_expired"
  | "token_consumed"
  | "token_scope_mismatch"
  | "audit_required";

export interface Actor {
  id: string;
  roles: string[];
  attributes?: Record<string, unknown>;
}

export interface Action {
  name: string;
  risk: "low" | "medium" | "high" | "critical";
  requiredRoles?: string[];
  requiresReason?: boolean;
  requiresReview?: boolean;
}

export interface Scope {
  tenantId?: string;
  targetId?: string;
  resourceType?: string;
  constraints?: Record<string, unknown>;
}

export interface AuthorityRequest {
  actor: Actor;
  action: string;
  target: string;
  reason?: string;
  scope?: Scope;
  metadata?: Record<string, unknown>;
}

export interface AuthorityDecision {
  id: string;
  state: DecisionState;
  request: AuthorityRequest;
  scope: Scope;
  denialReason?: DenialReason;
  reviewReason?: string;
  token?: ExecutionToken;
  createdAt: string;
}

export interface ExecutionToken {
  id: string;
  decisionId: string;
  actorId: string;
  action: string;
  target: string;
  scope: Scope;
  issuedAt: string;
  expiresAt: string;
}

export interface TokenConsumption {
  tokenId: string;
  consumedAt: string;
  result: "executed" | "rejected";
  reason?: DenialReason;
}

export interface AuditRecord {
  id: string;
  type:
    | "authority_requested"
    | "authority_allowed"
    | "authority_denied"
    | "authority_held"
    | "token_consumed"
    | "execution_rejected"
    | "execution_completed";
  actorId: string;
  action: string;
  target: string;
  decisionId?: string;
  tokenId?: string;
  reason?: string;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface Policy {
  action: Action;
  allowedScopes?: Scope[];
}

export interface GuardConfig {
  policies: Policy[];
  tokenTtlMs?: number;
  now?: () => Date;
  idFactory?: () => string;
  auditSink?: (record: AuditRecord) => Promise<void> | void;
}

export class KnotGuardError extends Error {
  constructor(
    message: string,
    public readonly reason: DenialReason,
  ) {
    super(message);
    this.name = "KnotGuardError";
  }
}
