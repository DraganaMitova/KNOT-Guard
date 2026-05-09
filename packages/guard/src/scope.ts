import type { Scope } from "./types.js";

export function scopeMatches(allowed: Scope | undefined, requested: Scope | undefined): boolean {
  if (!allowed) {
    return true;
  }

  if (!requested) {
    return false;
  }

  return matchesValue(allowed.tenantId, requested.tenantId)
    && matchesValue(allowed.targetId, requested.targetId)
    && matchesValue(allowed.resourceType, requested.resourceType)
    && constraintsMatch(allowed.constraints, requested.constraints);
}

export function bindScope(requested: Scope | undefined, target: string): Scope {
  return {
    ...(requested ?? {}),
    targetId: requested?.targetId ?? target,
  };
}

function matchesValue(allowed: string | undefined, actual: string | undefined): boolean {
  return allowed === undefined || allowed === "*" || allowed === actual;
}

function constraintsMatch(
  allowed: Record<string, unknown> | undefined,
  actual: Record<string, unknown> | undefined,
): boolean {
  if (!allowed) {
    return true;
  }

  if (!actual) {
    return false;
  }

  return Object.entries(allowed).every(([key, value]) => {
    if (value === "*") {
      return key in actual;
    }

    return actual[key] === value;
  });
}
