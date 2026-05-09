import { InMemoryAuditLog } from "./audit.js";
import { ReplayProtection } from "./replay.js";
import { bindScope, scopeMatches } from "./scope.js";
import type {
  AuditRecord,
  AuditStore,
  AuthorityDecision,
  AuthorityRequest,
  DenialReason,
  ExecutionToken,
  GuardConfig,
  Policy,
  ReplayStore,
  StoredAuditRecord,
} from "./types.js";
import { KnotGuardError } from "./types.js";

const DEFAULT_TOKEN_TTL_MS = 60_000;

export class KnotGuard {
  private readonly policies: Map<string, Policy>;
  private readonly tokenTtlMs: number;
  private readonly policyVersion?: string;
  private readonly now: () => Date;
  private readonly idFactory: () => string;
  private readonly replayStore: ReplayStore;
  private readonly auditStore: AuditStore;
  private readonly auditSink?: GuardConfig["auditSink"];

  constructor(config: GuardConfig) {
    this.policies = new Map(config.policies.map((policy) => [policy.action.name, policy]));
    this.tokenTtlMs = config.tokenTtlMs ?? DEFAULT_TOKEN_TTL_MS;
    this.policyVersion = config.policyVersion;
    this.now = config.now ?? (() => new Date());
    this.idFactory = config.idFactory ?? randomId;
    this.replayStore = config.replayStore ?? new ReplayProtection();
    this.auditStore = config.auditStore ?? new InMemoryAuditLog();
    this.auditSink = config.auditSink;
  }

  async requestAuthority(request: AuthorityRequest): Promise<AuthorityDecision> {
    const createdAt = this.nowIso();
    const policy = this.policies.get(request.action);
    const scope = bindScope(request.scope, request.target);
    const decisionId = this.idFactory();

    await this.audit({
      id: this.idFactory(),
      type: "authority_requested",
      actorId: request.actor.id,
      action: request.action,
      target: request.target,
      decisionId,
      reason: request.reason,
      createdAt,
      data: { scope },
    });

    if (!policy) {
      return this.deny(decisionId, request, scope, "actor_not_allowed", createdAt);
    }

    if (policy.action.requiresReason && !request.reason) {
      return this.deny(decisionId, request, scope, "missing_reason", createdAt);
    }

    if (!hasRequiredRole(request.actor.roles, policy.action.requiredRoles)) {
      return this.deny(decisionId, request, scope, "actor_not_allowed", createdAt);
    }

    if (policy.allowedScopes?.length && !policy.allowedScopes.some((allowedScope) => scopeMatches(allowedScope, scope))) {
      return this.deny(decisionId, request, scope, "scope_mismatch", createdAt);
    }

    if (policy.action.requiresReview || policy.action.risk === "critical") {
      const decision: AuthorityDecision = {
        id: decisionId,
      state: "hold",
      request,
      scope,
      policyVersion: this.policyVersion,
      reviewReason: policy.action.requiresReview ? "manual_review_required" : "critical_risk",
      createdAt,
      };

      await this.auditDecision(decision, "authority_held");
      return decision;
    }

    const token = this.mintToken(decisionId, request, scope);
    const decision: AuthorityDecision = {
      id: decisionId,
      state: "allow",
      request,
      scope,
      policyVersion: this.policyVersion,
      token,
      createdAt,
    };

    await this.auditDecision(decision, "authority_allowed");
    return decision;
  }

  async execute<T>(
    decision: AuthorityDecision,
    operation: () => Promise<T> | T,
  ): Promise<T> {
    if (decision.state !== "allow" || !decision.token) {
      await this.rejectExecution(decision, "audit_required");
      throw new KnotGuardError("Execution requires an allow decision with a token.", "audit_required");
    }

    const token = decision.token;

    if (new Date(token.expiresAt).getTime() <= this.now().getTime()) {
      await this.rejectExecution(decision, "token_expired");
      throw new KnotGuardError("Execution token has expired.", "token_expired");
    }

    if (!tokenStillMatchesDecision(token, decision)) {
      await this.rejectExecution(decision, "token_scope_mismatch");
      throw new KnotGuardError("Execution token no longer matches the authority decision.", "token_scope_mismatch");
    }

    const consumption = await this.replayStore.consume(token, this.nowIso());

    if (consumption.result === "rejected") {
      await this.rejectExecution(decision, consumption.reason ?? "token_consumed");
      throw new KnotGuardError("Execution token has already been consumed.", consumption.reason ?? "token_consumed");
    }

    await this.audit({
      id: this.idFactory(),
      type: "token_consumed",
      actorId: token.actorId,
      action: token.action,
      target: token.target,
      decisionId: decision.id,
      tokenId: token.id,
      createdAt: consumption.consumedAt,
    });

    const result = await operation();

    await this.audit({
      id: this.idFactory(),
      type: "execution_completed",
      actorId: token.actorId,
      action: token.action,
      target: token.target,
      decisionId: decision.id,
      tokenId: token.id,
      createdAt: this.nowIso(),
    });

    return result;
  }

  async auditRecords(): Promise<StoredAuditRecord[]> {
    return this.auditStore.all();
  }

  private async deny(
    decisionId: string,
    request: AuthorityRequest,
    scope: AuthorityDecision["scope"],
    denialReason: DenialReason,
    createdAt: string,
  ): Promise<AuthorityDecision> {
    const decision: AuthorityDecision = {
      id: decisionId,
      state: "deny",
      request,
      scope,
      policyVersion: this.policyVersion,
      denialReason,
      createdAt,
    };

    await this.auditDecision(decision, "authority_denied");
    return decision;
  }

  private mintToken(
    decisionId: string,
    request: AuthorityRequest,
    scope: AuthorityDecision["scope"],
  ): ExecutionToken {
    const issuedAt = this.now();
    const expiresAt = new Date(issuedAt.getTime() + this.tokenTtlMs);

    return {
      id: this.idFactory(),
      decisionId,
      actorId: request.actor.id,
      action: request.action,
      target: request.target,
      scope,
      policyVersion: this.policyVersion,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  }

  private async auditDecision(
    decision: AuthorityDecision,
    type: "authority_allowed" | "authority_denied" | "authority_held",
  ): Promise<void> {
    await this.audit({
      id: this.idFactory(),
      type,
      actorId: decision.request.actor.id,
      action: decision.request.action,
      target: decision.request.target,
      decisionId: decision.id,
      tokenId: decision.token?.id,
      reason: decision.denialReason ?? decision.reviewReason,
      createdAt: this.nowIso(),
      data: { scope: decision.scope },
    });
  }

  private async rejectExecution(decision: AuthorityDecision, reason: DenialReason): Promise<void> {
    await this.audit({
      id: this.idFactory(),
      type: "execution_rejected",
      actorId: decision.request.actor.id,
      action: decision.request.action,
      target: decision.request.target,
      decisionId: decision.id,
      tokenId: decision.token?.id,
      reason,
      createdAt: this.nowIso(),
    });
  }

  private async audit(record: AuditRecord): Promise<void> {
    const stored = await this.auditStore.append(record);
    await this.auditSink?.(stored);
  }

  private nowIso(): string {
    return this.now().toISOString();
  }
}

function hasRequiredRole(actorRoles: string[], requiredRoles: string[] | undefined): boolean {
  return !requiredRoles?.length || requiredRoles.some((role) => actorRoles.includes(role));
}

function tokenStillMatchesDecision(token: ExecutionToken, decision: AuthorityDecision): boolean {
  return token.decisionId === decision.id
    && token.actorId === decision.request.actor.id
    && token.action === decision.request.action
    && token.target === decision.request.target
    && token.policyVersion === decision.policyVersion
    && JSON.stringify(token.scope) === JSON.stringify(decision.scope);
}

function randomId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `kg_${Math.random().toString(36).slice(2)}`;
}
