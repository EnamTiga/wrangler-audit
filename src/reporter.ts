import type { Finding } from "./types.js";

export interface AuditResult {
  configPath: string;
  findings: Finding[];
  errorCount: number;
  warnCount: number;
}

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const useColor = process.stdout.isTTY === true;
const paint = (code: string, s: string) => (useColor ? `${code}${s}${RESET}` : s);

export function reportHuman(result: AuditResult): string {
  const lines: string[] = [];
  lines.push(paint(BOLD, `wrangler-audit: ${result.configPath}`));
  if (result.findings.length === 0) {
    lines.push(paint(GREEN, "No issues found."));
    return lines.join("\n");
  }
  for (const f of result.findings) {
    const tag =
      f.severity === "error" ? paint(RED, "[error]") : paint(YELLOW, "[warn]");
    lines.push(`${tag} ${f.rule}: ${f.message}`);
    lines.push(`        fix: ${f.fix}`);
  }
  lines.push(
    `\n${result.errorCount} error(s), ${result.warnCount} warning(s).`
  );
  return lines.join("\n");
}

export function reportJson(result: AuditResult): string {
  return JSON.stringify(result, null, 2);
}
