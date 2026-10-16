import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse as parseToml } from "smol-toml";
import type { WranglerConfig } from "./types.js";

const CANDIDATES = ["wrangler.jsonc", "wrangler.json", "wrangler.toml"];

export function findConfig(rootDir: string): string | null {
  for (const name of CANDIDATES) {
    const p = join(rootDir, name);
    if (existsSync(p)) return p;
  }
  return null;
}

// Strip // and /* */ comments without touching string literals.
function stripJsonComments(src: string): string {
  let out = "";
  let i = 0;
  let inStr = false;
  let strChar = "";
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];
    if (inStr) {
      out += c;
      if (c === "\\") {
        out += next ?? "";
        i += 2;
        continue;
      }
      if (c === strChar) inStr = false;
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      inStr = true;
      strChar = c;
      out += c;
      i++;
      continue;
    }
    if (c === "/" && next === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && next === "*") {
      i += 2;
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

export function parseConfigFile(path: string): WranglerConfig {
  const raw = readFileSync(path, "utf8");
  if (path.endsWith(".toml")) {
    return parseToml(raw) as WranglerConfig;
  }
  return JSON.parse(stripJsonComments(raw)) as WranglerConfig;
}
