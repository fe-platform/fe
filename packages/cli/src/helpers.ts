import { join } from "path";
import { readFileSync } from "fs";

export function readPackageMeta(dir: string): { name: string; version: string } {
  const raw = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  if (!raw.name || !raw.version) throw new Error(`Missing name/version in ${dir}/package.json`);
  return { name: raw.name, version: raw.version };
}

export function readFeDeps(dir: string): Record<string, string> {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const devDeps: Record<string, string> = pkg.devDependencies ?? {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(devDeps)) {
    if (key.startsWith("fe(")) result[key] = value as string;
  }
  return result;
}

export function readFeDepKeys(dir: string): string[] {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  return Object.keys(pkg.devDependencies ?? {}).filter((k) => k.startsWith("fe("));
}

export function parseSpecVersion(sv: string): { specifier: string; version: string } {
  const idx = sv.indexOf(")@");
  if (idx === -1) throw new Error(`Invalid specifier@version: ${sv}`);
  return { specifier: sv.slice(0, idx + 1), version: sv.slice(idx + 2) };
}

export function slugFromSpecifier(specifier: string): string {
  return specifier.replace(/^fe\(/, "").replace(/\)$/, "").replace(/^@[^/]+\//, "");
}
