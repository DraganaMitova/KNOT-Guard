import { sha256Hex } from "./crypto.js";
import type { AuditRecord, AuditStore, StoredAuditRecord } from "./types.js";

export class InMemoryAuditLog implements AuditStore {
  private readonly records: StoredAuditRecord[] = [];

  async append(record: AuditRecord): Promise<StoredAuditRecord> {
    const previous = this.records.at(-1);
    const stored: StoredAuditRecord = {
      ...record,
      sequence: this.records.length + 1,
      previousHash: previous?.hash ?? null,
      hash: "",
    };

    stored.hash = await sha256Hex({
      ...stored,
      hash: undefined,
    });

    this.records.push(stored);
    return stored;
  }

  async all(): Promise<StoredAuditRecord[]> {
    return [...this.records];
  }

  async byDecision(decisionId: string): Promise<StoredAuditRecord[]> {
    return this.records.filter((record) => record.decisionId === decisionId);
  }

  async byToken(tokenId: string): Promise<StoredAuditRecord[]> {
    return this.records.filter((record) => record.tokenId === tokenId);
  }
}
