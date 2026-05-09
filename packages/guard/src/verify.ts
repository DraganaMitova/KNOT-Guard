import { sha256Hex } from "./crypto.js";
import type { StoredAuditRecord } from "./types.js";

export interface AuditVerificationFailure {
  index: number;
  sequence?: number;
  reason:
    | "empty_chain"
    | "sequence_gap"
    | "previous_hash_mismatch"
    | "hash_mismatch"
    | "checkpoint_mismatch";
  expected?: string | number | null;
  actual?: string | number | null;
}

export interface AuditVerificationOptions {
  expectedHeadHash?: string;
  expectedRecordCount?: number;
}

export interface AuditVerificationResult {
  valid: boolean;
  recordsChecked: number;
  headHash?: string;
  failures: AuditVerificationFailure[];
}

export async function verifyAuditChain(
  records: StoredAuditRecord[],
  options: AuditVerificationOptions = {},
): Promise<AuditVerificationResult> {
  if (records.length === 0) {
    return {
      valid: false,
      recordsChecked: 0,
      failures: [{ index: 0, reason: "empty_chain" }],
    };
  }

  const failures: AuditVerificationFailure[] = [];
  let previousHash: string | null = null;

  for (const [index, record] of records.entries()) {
    const expectedSequence = index + 1;

    if (record.sequence !== expectedSequence) {
      failures.push({
        index,
        sequence: record.sequence,
        reason: "sequence_gap",
        expected: expectedSequence,
        actual: record.sequence,
      });
    }

    if (record.previousHash !== previousHash) {
      failures.push({
        index,
        sequence: record.sequence,
        reason: "previous_hash_mismatch",
        expected: previousHash,
        actual: record.previousHash,
      });
    }

    const expectedHash = await sha256Hex({ ...record, hash: undefined });

    if (record.hash !== expectedHash) {
      failures.push({
        index,
        sequence: record.sequence,
        reason: "hash_mismatch",
        expected: expectedHash,
        actual: record.hash,
      });
    }

    previousHash = record.hash;
  }

  const headHash = records.at(-1)?.hash;

  if (options.expectedHeadHash && headHash !== options.expectedHeadHash) {
    failures.push({
      index: records.length - 1,
      sequence: records.at(-1)?.sequence,
      reason: "checkpoint_mismatch",
      expected: options.expectedHeadHash,
      actual: headHash,
    });
  }

  if (options.expectedRecordCount !== undefined && records.length !== options.expectedRecordCount) {
    failures.push({
      index: records.length - 1,
      sequence: records.at(-1)?.sequence,
      reason: "checkpoint_mismatch",
      expected: options.expectedRecordCount,
      actual: records.length,
    });
  }

  return {
    valid: failures.length === 0,
    recordsChecked: records.length,
    headHash,
    failures,
  };
}
