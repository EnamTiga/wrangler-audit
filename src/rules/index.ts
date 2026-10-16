import type { AuditContext, Finding, Rule } from "../types.js";
import { plaintextSecrets } from "./plaintextSecrets.js";
import { unusedBindings } from "./unusedBindings.js";
import { staleCompatibilityDate } from "./staleCompatibilityDate.js";
import { workersDevWithRoutes } from "./workersDevWithRoutes.js";
import { inconsistentEnvVars } from "./inconsistentEnvVars.js";

export const rules: Rule[] = [
  plaintextSecrets,
  unusedBindings,
  staleCompatibilityDate,
  workersDevWithRoutes,
  inconsistentEnvVars,
];

export function runRules(ctx: AuditContext): Finding[] {
  return rules.flatMap((rule) => {
    try {
      return rule.check(ctx);
    } catch {
      return [];
    }
  });
}
