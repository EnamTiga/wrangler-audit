import type { AuditContext, Finding, Rule } from "../types.js";

// workers_dev exposes the Worker on <name>.<account>.workers.dev. Combined
// with custom routes, the workers.dev URL stays publicly reachable even when
// the team assumes traffic only flows through their own domain.
export const workersDevWithRoutes: Rule = {
  id: "R4",
  check(ctx: AuditContext): Finding[] {
    if (ctx.config.workers_dev !== true) return [];
    const routes = ctx.config.routes;
    const hasRoutes =
      (Array.isArray(routes) && routes.length > 0) || ctx.config.route !== undefined;
    if (!hasRoutes) return [];
    return [
      {
        rule: "R4",
        severity: "warn",
        message: `workers_dev is enabled while custom routes are configured`,
        fix: `If the workers.dev URL should not be public, set workers_dev = false.`,
        location: ctx.configPath,
      },
    ];
  },
};
