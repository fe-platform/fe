import { join } from "path";
import { cpSync, mkdirSync } from "fs";
import { ROOT, UPLOADS_DIR, readPackageMeta } from "./config";

// Uploads a built MFE to the local filesystem registry.
// Path convention: uploads/{name}/{version}/
//
// NOTE on auth: uploads are currently open (no auth) — the filesystem is local.
// When graduating to blob storage, add a check for FE_UPLOAD_KEY env var here.
// Config updates (which version is "live") are intentionally NOT done here.
// That separation means: anyone can upload a candidate; only a privileged actor
// (a pipeline, or a human editing configs/import-map.json) decides what's active.
export function adminUpload(target: string): void {
  const dir = join(ROOT, target);
  const distDir = join(dir, "dist");

  if (!Bun.file(join(distDir, "index.js")).size) {
    console.error(`No dist/index.js found for ${target}. Run: bun cli/src/index.ts build ${target}`);
    process.exit(1);
  }

  const { name, version } = readPackageMeta(dir);
  // Strip scope prefix for the path (e.g. @acme/mfe-a → mfe-a)
  const slug = name.replace(/^@[^/]+\//, "");
  const uploadPath = join(UPLOADS_DIR, slug, version);

  mkdirSync(uploadPath, { recursive: true });
  cpSync(distDir, uploadPath, { recursive: true });

  // Print the URL for this upload. For filesystem use, this is a relative path.
  // Replace this prefix with your CDN base URL when moving to blob storage.
  const url = `./uploads/${slug}/${version}/index.js`;
  console.log(`Uploaded ${name}@${version}`);
  console.log(`URL: ${url}`);
  console.log(``);
  console.log(`Update configs/import-map.json manually:`);
  console.log(`  "fe:${name}": "${url}"`);
}
