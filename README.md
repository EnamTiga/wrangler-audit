# wrangler-audit

A standalone CLI that audits Cloudflare Workers configuration (`wrangler.toml`, `wrangler.json`, `wrangler.jsonc`) for security and posture issues. Security-first and vendor-neutral: no AI agent required, no observability vendor lock-in.

Wrangler validates schema. wrangler-audit checks posture: plaintext secrets in `[vars]`, dead bindings, stale `compatibility_date`, unintended public `workers.dev` exposure, and inconsistent variables across environments.

## Install

```bash
npm install -g wrangler-audit
```

Or run without installing:

```bash
npx wrangler-audit
```

## Usage

```bash
# Audit the current directory
wrangler-audit

# Audit a specific project
wrangler-audit ./my-worker

# Machine-readable output for CI
wrangler-audit --json
```

Exit codes: `0` clean or warnings only, `1` when any `error` finding exists, `2` on usage errors (no config found, bad flags).

### CI example

```yaml
- name: Audit wrangler config
  run: npx wrangler-audit --json
```

Fail the pipeline on errors; warnings are informational.

## Rules

| ID | Severity | What it checks |
|----|----------|----------------|
| R1 | error | Secret-like key (`SECRET`, `PASSWORD`, `TOKEN`, `API_KEY`, ...) with a real-looking value in `[vars]` — belongs in `wrangler secret`, not in the file |
| R2 | warn | Binding (`kv_namespaces`, `r2_buckets`, `d1_databases`, queue producers) declared but never referenced in source |
| R3 | warn | `compatibility_date` older than 6 months |
| R4 | warn | `workers_dev = true` while custom `routes` are configured (the workers.dev URL stays publicly reachable) |
| R5 | warn | Variable name present in one environment's `[vars]` but missing in another |

Each finding includes a concrete fix suggestion. Placeholder values (`changeme`, `xxx`, `${...}`, empty) are ignored by R1.

## JSON output

`--json` prints:

```json
{
  "configPath": "/path/to/wrangler.toml",
  "findings": [
    {
      "rule": "R1",
      "severity": "error",
      "message": "Possible plaintext secret \"API_SECRET\" in [vars]",
      "fix": "Remove it from the config and set it with: wrangler secret put API_SECRET",
      "location": "/path/to/wrangler.toml [vars]"
    }
  ],
  "errorCount": 1,
  "warnCount": 0
}
```

## Development

```bash
npm install
npm test      # vitest
npm run build # tsc -> dist/
```

## License

MIT
