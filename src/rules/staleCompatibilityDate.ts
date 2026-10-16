import type { AuditContext, Finding, Rule } from "../types.js";

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// A stale compatibility_date pins the Worker to an old runtime: missed
// performance work and, worse, old default behaviors with known quirks.
export const staleCompatibilityDate: Rule = {
  id: "R3",
  check(ctx: AuditContext): Finding[] {
    const raw = ctx.config.compatibility_date;
    if (typeof raw !== "string" || !DATE_RE.test(raw)) return [];
    const parsed = new Date(raw + "T00:00:00Z").getTime();
    if (Number.isNaN(parsed)) return [];
    if (Date.now() - parsed < SIX_MONTHS_MS) return [];
    return [
      {
        rule: "R3",
        severity: "warn",
        message: `compatibility_date "${raw}" is older than 6 months`,
        fix: `Review runtime changes, then advance compatibility_date to today and test.`,
        location: ctx.configPath,
      },
    ];
  },
};
