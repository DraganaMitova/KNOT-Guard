import type { ExecutionToken, TokenConsumption } from "./types.js";

export class ReplayProtection {
  private readonly consumed = new Map<string, TokenConsumption>();

  hasBeenConsumed(token: ExecutionToken): boolean {
    return this.consumed.has(token.id);
  }

  consume(token: ExecutionToken, consumedAt: string): TokenConsumption {
    const existing = this.consumed.get(token.id);

    if (existing) {
      return existing;
    }

    const consumption: TokenConsumption = {
      tokenId: token.id,
      consumedAt,
      result: "executed",
    };

    this.consumed.set(token.id, consumption);
    return consumption;
  }

  getConsumption(tokenId: string): TokenConsumption | undefined {
    return this.consumed.get(tokenId);
  }
}
