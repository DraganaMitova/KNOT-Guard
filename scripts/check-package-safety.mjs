#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const packageFiles = [
  "package.json",
  "packages/guard/package.json",
  "apps/bank-admin-demo/package.json",
  "apps/authority-runtime-api/package.json",
];

const blockedLifecycleScripts = new Set([
  "preinstall",
  "install",
  "postinstall",
  "prepare",
  "prepublish",
  "prepublishOnly",
  "prepack",
  "postpack",
]);

const failures = [];

for (const packageFile of packageFiles) {
  const pkg = JSON.parse(await readFile(packageFile, "utf8"));
  const scripts = pkg.scripts ?? {};

  for (const scriptName of Object.keys(scripts)) {
    if (blockedLifecycleScripts.has(scriptName)) {
      failures.push(`${packageFile} defines lifecycle script '${scriptName}'`);
    }
  }
}

if (failures.length > 0) {
  console.error("Package safety check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Package safety check passed: no install/prepare/publish lifecycle hooks found.");
