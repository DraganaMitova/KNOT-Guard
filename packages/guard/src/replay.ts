import type { ExecutionToken, ReplayStore, TokenConsumption } from "./types.js";

export class ReplayProtection implements ReplayStore {
  private readonly consumed = new Map<string, TokenConsumption>();

  hasBeenConsumed(token: ExecutionToken): boolean {
    return this.consumed.has(token.id);
  }

  async consume(token: ExecutionToken, consumedAt: string): Promise<TokenConsumption> {
    const existing = this.consumed.get(token.id);

    if (existing) {
      return {
        tokenId: token.id,
        consumedAt,
        result: "rejected",
        reason: "token_consumed",
      };
    }

    const consumption: TokenConsumption = {
      tokenId: token.id,
      consumedAt,
      result: "executed",
    };

    this.consumed.set(token.id, consumption);
    return consumption;
  }

  async getConsumption(tokenId: string): Promise<TokenConsumption | undefined> {
    return this.consumed.get(tokenId);
  }
}
