export type Severity = "error" | "warn";

export interface Finding {
  rule: string;
  severity: Severity;
  message: string;
  fix: string;
  location?: string;
}

export interface WranglerConfig {
  name?: string;
  compatibility_date?: string;
  workers_dev?: boolean;
  vars?: Record<string, string>;
  routes?: Array<string | { pattern: string }>;
  route?: string | { pattern: string };
  kv_namespaces?: Array<{ binding: string; id?: string }>;
  r2_buckets?: Array<{ binding: string; bucket_name?: string }>;
  d1_databases?: Array<{ binding: string; database_id?: string }>;
  env?: Record<string, WranglerConfig>;
  [key: string]: unknown;
}

export interface AuditContext {
  config: WranglerConfig;
  configPath: string;
  rootDir: string;
}

export interface Rule {
  id: string;
  check(ctx: AuditContext): Finding[];
}
