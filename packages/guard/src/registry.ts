import type { AuthorityDecision, AuthorityRequest, ExecutionResult } from "./types.js";
import type { KnotGuard } from "./guard.js";
import { KnotGuardError } from "./types.js";

export type ProtectedOperation<TInput, TOutput> = (input: TInput) => Promise<TOutput> | TOutput;

export interface ProtectedAction<TInput, TOutput> {
  action: string;
  buildRequest(input: TInput): AuthorityRequest;
  execute(input: TInput, decision: AuthorityDecision): Promise<TOutput> | TOutput;
}

export class ProtectedActionRegistry {
  private readonly actions = new Map<string, ProtectedAction<unknown, unknown>>();

  constructor(private readonly guard: KnotGuard) {}

  register<TInput, TOutput>(definition: ProtectedAction<TInput, TOutput>): void {
    if (this.actions.has(definition.action)) {
      throw new Error(`Protected action already registered: ${definition.action}`);
    }

    this.actions.set(definition.action, definition as ProtectedAction<unknown, unknown>);
  }

  async run<TInput, TOutput>(
    action: string,
    input: TInput,
  ): Promise<ExecutionResult<TOutput>> {
    const definition = this.actions.get(action) as ProtectedAction<TInput, TOutput> | undefined;

    if (!definition) {
      throw new Error(`Protected action is not registered: ${action}`);
    }

    const decision = await this.guard.requestAuthority(definition.buildRequest(input));

    if (decision.state !== "allow") {
      throw new KnotGuardError(
        `Protected action was not allowed: ${action}`,
        decision.denialReason ?? "audit_required",
      );
    }

    return this.guard.executeWithReceipt(decision, () => definition.execute(input, decision));
  }
}
