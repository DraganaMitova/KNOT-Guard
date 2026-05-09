#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const roots = [
  "README.md",
  "SECURITY.md",
  "CHANGELOG.md",
  "docs",
  "packages",
  "apps",
  ".github",
];

const skippedDirectories = new Set([".git", "node_modules", "dist", "coverage"]);
const checkedExtensions = new Set([
  ".md",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".json",
  ".yml",
  ".yaml",
]);

const dangerousClaims = [
  {
    pattern: /\btamper-proof\b/i,
    allowed: /\b(not|does not|do not|isn't|cannot|can't)\b.*\btamper-proof\b/i,
    message: "Do not claim tamper-proof storage; use tamper-evident and name checkpoint assumptions.",
  },
  {
    pattern: /\bunhackable\b/i,
    allowed: /\b(not|does not|do not|isn't|cannot|can't)\b.*\bunhackable\b/i,
    message: "Do not claim unhackable software.",
  },
  {
    pattern: /\bproduction-trusted\b/i,
    allowed: /\b(not|does not|do not|isn't|cannot|can't)\b.*\bproduction-trusted\b/i,
    message: "Do not claim production trust before independent evidence exists.",
  },
  {
    pattern: /\benterprise-grade\b/i,
    allowed: /\b(not|does not|do not|isn't|cannot|can't)\b.*\benterprise-grade\b/i,
    message: "Do not claim enterprise-grade maturity before audit, adoption, and release evidence exist.",
  },
  {
    pattern: /\bformally proven\b/i,
    allowed: /\b(not|does not|do not|isn't|cannot|can't)\b.*\bformally proven\b/i,
    message: "Do not claim formal proof unless formal verification exists.",
  },
  {
    pattern: /\bindependently audited\b/i,
    allowed: /\b(not|does not|do not|isn't|cannot|can't)\b.*\bindependently audited\b/i,
    message: "Do not claim an independent audit until one exists.",
  },
  {
    pattern: /\bguaranteed\b/i,
    allowed: /\b(not|does not|do not|isn't|cannot|can't|no)\b.*\bguaranteed\b/i,
    message: "Avoid absolute guaranteed language; name the boundary and evidence.",
  },
];

const failures = [];

function extensionOf(filePath) {
  const match = filePath.match(/(\.[^.]+)$/);
  return match ? match[1] : "";
}

async function collectFiles(path) {
  const entries = await readdir(path, { withFileTypes: true }).catch(() => null);

  if (!entries) {
    return [path];
  }

  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!skippedDirectories.has(entry.name)) {
        files.push(...await collectFiles(join(path, entry.name)));
      }
      continue;
    }

    if (entry.isFile() && checkedExtensions.has(extensionOf(entry.name))) {
      files.push(join(path, entry.name));
    }
  }

  return files;
}

const files = (await Promise.all(roots.map((root) => collectFiles(root)))).flat();

for (const file of files) {
  if (!checkedExtensions.has(extensionOf(file))) {
    continue;
  }

  const content = await readFile(file, "utf8");
  const lines = content.split(/\r?\n/);
  let insideDisallowedLanguageSection = false;

  lines.forEach((line, index) => {
    if (file === "docs/ASSURANCE.md") {
      if (line.trim() === "## Disallowed Language") {
        insideDisallowedLanguageSection = true;
      } else if (insideDisallowedLanguageSection && line.startsWith("## ")) {
        insideDisallowedLanguageSection = false;
      }
    }

    if (insideDisallowedLanguageSection) {
      return;
    }

    for (const claim of dangerousClaims) {
      if (claim.pattern.test(line) && !claim.allowed.test(line)) {
        failures.push(`${file}:${index + 1}: ${claim.message}`);
      }
    }
  });
}

if (failures.length > 0) {
  console.error("Assurance language check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Assurance language check passed: no unsupported absolute security claims found.");
