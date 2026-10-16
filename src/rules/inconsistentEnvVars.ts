import type { AuditContext, Finding, Rule } from "../types.js";

// A var name present in one environment but missing in another (and not at
// top level) usually means someone forgot to define it everywhere. At
// runtime that is an undefined variable, not a fallback.
export const inconsistentEnvVars: Rule = {
  id: "R5",
  check(ctx: AuditContext): Finding[] {
    const envs = ctx.config.env ?? {};
    const envNames = Object.keys(envs);
    if (envNames.length < 2) return [];
    const topLevel = new Set(Object.keys(ctx.config.vars ?? {}));
    const perEnv = new Map<string, Set<string>>();
    for (const [name, cfg] of Object.entries(envs)) {
      perEnv.set(name, new Set(Object.keys(cfg.vars ?? {})));
    }
    const allNames = new Set<string>();
    for (const names of perEnv.values()) for (const n of names) allNames.add(n);

    const findings: Finding[] = [];
    for (const varName of allNames) {
      if (topLevel.has(varName)) continue;
      const missing = envNames.filter((e) => !perEnv.get(e)!.has(varName));
      if (missing.length > 0 && missing.length < envNames.length) {
        const present = envNames.filter((e) => !missing.includes(e));
        findings.push({
          rule: "R5",
          severity: "warn",
          message: `Var "${varName}" is defined in [${present
            .map((e) => `env.${e}`)
            .join(", ")}] but missing in [${missing.map((e) => `env.${e}`).join(", ")}]`,
          fix: `Define "${varName}" in every environment, or once at top-level [vars].`,
          location: ctx.configPath,
        });
      }
    }
    return findings;
  },
};
