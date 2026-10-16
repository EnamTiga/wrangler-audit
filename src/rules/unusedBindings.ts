import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import type { AuditContext, Finding, Rule, WranglerConfig } from "../types.js";

const SOURCE_EXTS = new Set([".ts", ".js", ".tsx", ".jsx", ".mjs", ".cjs"]);
const SKIP_DIRS = new Set(["node_modules", "dist", "build", ".git", ".wrangler", "coverage"]);

function collectSources(dir: string, acc: string[] = []): string[] {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) collectSources(full, acc);
    } else if (SOURCE_EXTS.has(extname(entry))) {
      acc.push(full);
    }
  }
  return acc;
}

function declaredBindings(config: WranglerConfig): string[] {
  const names: string[] = [];
  const pushAll = (arr: Array<{ binding?: string }> | undefined) => {
    for (const item of arr ?? []) {
      if (item?.binding) names.push(item.binding);
    }
  };
  pushAll(config.kv_namespaces);
  pushAll(config.r2_buckets);
  pushAll(config.d1_databases);
  const queues = config.queues as
    | { producers?: Array<{ binding?: string }> }
    | undefined;
  pushAll(queues?.producers);
  return [...new Set(names)];
}

// A declared binding nobody references is either dead config or a typo away
// from a runtime error. Either way it deserves a look.
export const unusedBindings: Rule = {
  id: "R2",
  check(ctx: AuditContext): Finding[] {
    const bindings = declaredBindings(ctx.config);
    if (bindings.length === 0) return [];
    const corpus = collectSources(ctx.rootDir)
      .map((f) => {
        try {
          return readFileSync(f, "utf8");
        } catch {
          return "";
        }
      })
      .join("\n");
    return bindings
      .filter((name) => !new RegExp(`\\b${name}\\b`).test(corpus))
      .map((name) => ({
        rule: "R2",
        severity: "warn" as const,
        message: `Binding "${name}" is declared but never referenced in source`,
        fix: `Remove it from the config, or wire it up in your Worker code.`,
        location: ctx.configPath,
      }));
  },
};
