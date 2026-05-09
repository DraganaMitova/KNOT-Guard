#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { verifyAuditChain } from "../dist/index.js";

const [, , command, file] = process.argv;

if (command !== "verify-audit" || !file) {
  console.error("Usage: knot-guard verify-audit <audit.json|audit.jsonl>");
  process.exit(2);
}

const input = await readFile(file, "utf8");
const records = parseRecords(input);
const result = await verifyAuditChain(records);

console.log(JSON.stringify(result, null, 2));
process.exit(result.valid ? 0 : 1);

function parseRecords(input) {
  const trimmed = input.trim();

  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }

  return trimmed
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
