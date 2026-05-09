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
  policyVersion?: string;
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
  policyVersion?: string;
  issuedAt: string;
  expiresAt: string;
}

export interface TokenConsumption {
  tokenId: string;
  consumedAt: string;
  result: "executed" | "rejected";
  reason?: DenialReason;
}

export interface TransitionReceipt {
  decisionId: string;
  tokenId: string;
  actorId: string;
  action: string;
  target: string;
  scope: Scope;
  policyVersion?: string;
  consumedAt: string;
  executedAt: string;
  tokenConsumedAuditHash: string;
  executionAuditHash: string;
}

export interface ExecutionResult<T> {
  result: T;
  receipt: TransitionReceipt;
}

export interface ReplayStore {
  consume(token: ExecutionToken, consumedAt: string): Promise<TokenConsumption>;
  getConsumption(tokenId: string): Promise<TokenConsumption | undefined>;
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

export interface StoredAuditRecord extends AuditRecord {
  sequence: number;
  previousHash: string | null;
  hash: string;
}

export interface AuditStore {
  append(record: AuditRecord): Promise<StoredAuditRecord>;
  all(): Promise<StoredAuditRecord[]>;
  byDecision(decisionId: string): Promise<StoredAuditRecord[]>;
  byToken(tokenId: string): Promise<StoredAuditRecord[]>;
}

export interface Policy {
  action: Action;
  allowedScopes?: Scope[];
}

export interface GuardConfig {
  policies: Policy[];
  policyVersion?: string;
  tokenTtlMs?: number;
  now?: () => Date;
  idFactory?: () => string;
  auditStore?: AuditStore;
  replayStore?: ReplayStore;
  auditSink?: (record: StoredAuditRecord) => Promise<void> | void;
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
