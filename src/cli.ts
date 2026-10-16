#!/usr/bin/env node
import { resolve } from "node:path";
import { findConfig, parseConfigFile } from "./config.js";
import { runRules } from "./rules/index.js";
import { reportHuman, reportJson } from "./reporter.js";

function usage(): never {
  console.error("Usage: wrangler-audit [path] [--json]");
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.includes("-h") || args.includes("--help")) usage();
const json = args.includes("--json");
const target = resolve(args.find((a) => !a.startsWith("-")) ?? ".");

const configPath = findConfig(target);
if (!configPath) {
  console.error(`No wrangler.toml, wrangler.json, or wrangler.jsonc found in ${target}`);
  process.exit(2);
}

const config = parseConfigFile(configPath);
const findings = runRules({ config, configPath, rootDir: target });
const result = {
  configPath,
  findings,
  errorCount: findings.filter((f) => f.severity === "error").length,
  warnCount: findings.filter((f) => f.severity === "warn").length,
};

console.log(json ? reportJson(result) : reportHuman(result));
process.exit(result.errorCount > 0 ? 1 : 0);
