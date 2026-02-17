import { join } from "path";
import { readFileSync } from "fs";

export type ImportMap = { imports: Record<string, string> };

export const ROOT = join(import.meta.dir, "..", "..");
export const CONFIGS_DIR = join(ROOT, "configs");
export const IMPORT_MAP_PATH = join(CONFIGS_DIR, "import-map.json");
export const UPLOADS_DIR = join(ROOT, "uploads");

export function readImportMap(): ImportMap {
  const text = readFileSync(IMPORT_MAP_PATH, "utf8");
  return JSON.parse(text);
}

export function writeImportMap(map: ImportMap): void {
  Bun.write(IMPORT_MAP_PATH, JSON.stringify(map, null, 2) + "\n");
}

// Reads the name + version from a package.json in the given directory.
export function readPackageMeta(dir: string): { name: string; version: string } {
  const raw = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  if (!raw.name || !raw.version) throw new Error(`Missing name/version in ${dir}/package.json`);
  return { name: raw.name, version: raw.version };
}
