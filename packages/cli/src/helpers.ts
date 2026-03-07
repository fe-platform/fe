import { join } from "path";
import { readFileSync } from "fs";
import { isMfeSpecifier, parseSpecVersion, slugFromSpecifier } from "@fe/specifier";

export { isMfeSpecifier, parseSpecVersion, slugFromSpecifier };

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
    if (isMfeSpecifier(key)) result[key] = value as string;
  }
  return result;
}

export function readFeDepKeys(dir: string): string[] {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  return Object.keys(pkg.devDependencies ?? {}).filter(isMfeSpecifier);
}
