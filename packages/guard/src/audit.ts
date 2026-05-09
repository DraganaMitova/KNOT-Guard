import type { AuditRecord } from "./types.js";

export class InMemoryAuditLog {
  private readonly records: AuditRecord[] = [];

  async write(record: AuditRecord): Promise<void> {
    this.records.push(record);
  }

  all(): AuditRecord[] {
    return [...this.records];
  }

  byDecision(decisionId: string): AuditRecord[] {
    return this.records.filter((record) => record.decisionId === decisionId);
  }

  byToken(tokenId: string): AuditRecord[] {
    return this.records.filter((record) => record.tokenId === tokenId);
  }
}
