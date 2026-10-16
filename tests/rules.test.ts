import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findConfig, parseConfigFile } from "../src/config.js";
import { runRules } from "../src/rules/index.js";
import type { AuditContext } from "../src/types.js";

const root = dirname(fileURLToPath(import.meta.url));

function audit(fixture: string): ReturnType<typeof runRules> {
  const dir = join(root, "fixtures", fixture);
  const configPath = findConfig(dir)!;
  expect(configPath).toBeTruthy();
  const ctx: AuditContext = {
    config: parseConfigFile(configPath),
    configPath,
    rootDir: dir,
  };
  return runRules(ctx);
}

const byRule = (findings: ReturnType<typeof runRules>, id: string) =>
  findings.filter((f) => f.rule === id);

describe("bad fixture triggers every rule", () => {
  const findings = audit("bad");

  it("R1 flags plaintext secrets as errors", () => {
    const r1 = byRule(findings, "R1");
    expect(r1.length).toBeGreaterThanOrEqual(3);
    expect(r1.every((f) => f.severity === "error")).toBe(true);
    expect(r1.some((f) => f.message.includes("API_SECRET"))).toBe(true);
    expect(r1.some((f) => f.message.includes("DB_PASSWORD"))).toBe(true);
    expect(r1[0].fix).toContain("wrangler secret put");
  });

  it("R2 flags the unreferenced binding", () => {
    const r2 = byRule(findings, "R2");
    expect(r2).toHaveLength(1);
    expect(r2[0].message).toContain("UNUSED_KV");
  });

  it("R3 flags the stale compatibility_date", () => {
    const r3 = byRule(findings, "R3");
    expect(r3).toHaveLength(1);
    expect(r3[0].message).toContain("2023-01-15");
  });

  it("R4 flags workers_dev alongside routes", () => {
    const r4 = byRule(findings, "R4");
    expect(r4).toHaveLength(1);
  });

  it("R5 flags DB_PASSWORD missing from staging", () => {
    const r5 = byRule(findings, "R5");
    expect(r5).toHaveLength(1);
    expect(r5[0].message).toContain("DB_PASSWORD");
    expect(r5[0].message).toContain("staging");
  });

  it("reports at least one error overall", () => {
    expect(findings.some((f) => f.severity === "error")).toBe(true);
  });
});

describe("good fixture stays clean", () => {
  const findings = audit("good");

  it("produces no findings", () => {
    expect(findings).toHaveLength(0);
  });

  it("ignores placeholder secret values", () => {
    expect(byRule(findings, "R1")).toHaveLength(0);
  });

  it("does not flag the referenced CACHE binding", () => {
    expect(byRule(findings, "R2")).toHaveLength(0);
  });

  it("does not flag consistent env vars", () => {
    expect(byRule(findings, "R5")).toHaveLength(0);
  });
});

describe("config formats", () => {
  it("finds wrangler.toml", () => {
    expect(findConfig(join(root, "fixtures", "bad"))).toMatch(/wrangler\.toml$/);
  });

  it("parses wrangler.jsonc with comments and stays clean", () => {
    const findings = audit("jsonc");
    expect(findings).toHaveLength(0);
  });
});
