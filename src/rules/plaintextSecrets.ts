import type { AuditContext, Finding, Rule } from "../types.js";

const SECRET_KEY = /(secret|password|passwd|token|api[_-]?key|private[_-]?key|auth[_-]?key)/i;
const PLACEHOLDER =
  /^(x{3,}|changeme|change[-_]?me|your[-_].*|placeholder|example|test|todo|<.*>|\$\{.*\}|)$/i;

function looksLikeSecretValue(value: unknown): boolean {
  if (typeof value !== "string" || value.length === 0) return false;
  if (PLACEHOLDER.test(value.trim())) return false;
  // Short generic words are usually not real secrets.
  if (value.trim().length < 4) return false;
  return true;
}

// [vars] are deployed as plaintext environment variables. Anything that
// smells like a credential belongs in `wrangler secret`, not in the file.
export const plaintextSecrets: Rule = {
  id: "R1",
  check(ctx: AuditContext): Finding[] {
    const findings: Finding[] = [];
    const scopes: Array<{ label: string; vars?: Record<string, string> }> = [
      { label: "[vars]", vars: ctx.config.vars },
    ];
    for (const [envName, envCfg] of Object.entries(ctx.config.env ?? {})) {
      scopes.push({ label: `[env.${envName}.vars]`, vars: envCfg.vars });
    }
    for (const { label, vars } of scopes) {
      for (const [key, value] of Object.entries(vars ?? {})) {
        if (SECRET_KEY.test(key) && looksLikeSecretValue(value)) {
          findings.push({
            rule: "R1",
            severity: "error",
            message: `Possible plaintext secret "${key}" in ${label}`,
            fix: `Remove it from the config and set it with: wrangler secret put ${key}`,
            location: `${ctx.configPath} ${label}`,
          });
        }
      }
    }
    return findings;
  },
};
