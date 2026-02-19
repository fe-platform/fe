import { join } from "path";
import { cpSync, mkdirSync } from "fs";
import {
  ROOT,
  UPLOADS_DIR,
  readPackageMeta,
  readFeDeps,
  readPlatformConfig,
  writePlatformConfig,
  slugFromSpecifier,
} from "./config";

// Uploads a built MFE to the local filesystem registry and registers it
// in configs/platform.json with its URL and fe() dependencies.
//
// NOTE on auth: uploads are currently open (no auth) — the filesystem is local.
// When graduating to blob storage, add a check for FE_UPLOAD_KEY env var here.
//
// The upload writes to the `packages` section (artifact metadata).
// The `routes` section (which version is active) is updated separately.
export function adminUpload(target: string): void {
  const dir = join(ROOT, target);
  const distDir = join(dir, "dist");

  if (!Bun.file(join(distDir, "index.js")).size) {
    console.error(`No dist/index.js found for ${target}. Run: bun cli/src/index.ts build ${target}`);
    process.exit(1);
  }

  const { name, version } = readPackageMeta(dir);
  const slug = slugFromSpecifier(name);
  const uploadPath = join(UPLOADS_DIR, slug, version);

  mkdirSync(uploadPath, { recursive: true });
  cpSync(distDir, uploadPath, { recursive: true });

  // Replace this prefix with your CDN base URL when moving to blob storage.
  const url = `./uploads/${slug}/${version}/index.js`;

  // Resolve fe() deps → semver ranges for the platform config.
  // For each fe() devDep, read the dep's version and generate a ^major.minor.patch range.
  const rawFeDeps = readFeDeps(dir);
  const deps: Record<string, string> = {};
  for (const depSpecifier of Object.keys(rawFeDeps)) {
    const depSlug = slugFromSpecifier(depSpecifier);
    const depDir = join(ROOT, depSlug);
    try {
      const depMeta = readPackageMeta(depDir);
      deps[depSpecifier] = `^${depMeta.version}`;
    } catch {
      // Dep not found locally — may be a cross-ecosystem dep already in config.
      console.warn(`  Warning: could not resolve version for ${depSpecifier}, skipping dep.`);
    }
  }

  // Write the package entry to platform.json.
  const config = readPlatformConfig();
  if (!config.packages[name]) {
    config.packages[name] = { versions: {} };
  }
  config.packages[name].versions[version] = { url, deps };
  writePlatformConfig(config);

  console.log(`Uploaded ${name}@${version}`);
  console.log(`URL: ${url}`);
  console.log(`Deps: ${Object.keys(deps).length === 0 ? "(none)" : Object.keys(deps).join(", ")}`);
  console.log(``);
  console.log(`Registered in configs/platform.json`);
  console.log(`To activate for a route, update the "routes" section.`);
}
