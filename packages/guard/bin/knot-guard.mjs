#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { verifyAuditChain } from "../dist/index.js";

const [, , command, file, ...flags] = process.argv;

if (command !== "verify-audit" || !file) {
  console.error("Usage: knot-guard verify-audit <audit.json|audit.jsonl> [--head <hash>] [--count <n>]");
  process.exit(2);
}

const input = await readFile(file, "utf8");
const records = parseRecords(input);
const result = await verifyAuditChain(records, parseOptions(flags));

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

function parseOptions(flags) {
  const options = {};

  for (let index = 0; index < flags.length; index += 1) {
    if (flags[index] === "--head") {
      options.expectedHeadHash = flags[index + 1];
      index += 1;
    } else if (flags[index] === "--count") {
      options.expectedRecordCount = Number.parseInt(flags[index + 1], 10);
      index += 1;
    }
  }

  return options;
}
