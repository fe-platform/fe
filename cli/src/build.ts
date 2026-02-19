import { join } from "path";
import { readFileSync } from "fs";
import { ROOT, readPlatformConfig, generateRouteImportMap } from "./config";

// Reads devDependencies from a package.json and returns all fe() specifiers.
// These are the MFE deps that must be external — resolved at runtime via import map.
function feDeps(dir: string): string[] {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  return Object.keys(pkg.devDependencies ?? {}).filter((k) => k.startsWith("fe("));
}

// Builds mfe-a, mfe-b, or shell into their respective dist/ folders.
export async function build(target: string): Promise<void> {
  if (target === "shell") return buildShell();

  const dir = join(ROOT, target);
  const result = await Bun.build({
    entrypoints: [join(dir, "src", "index.ts")],
    outdir: join(dir, "dist"),
    format: "esm",
    target: "browser",
    // Externalize all fe() deps — the browser resolves them via import map at runtime.
    external: feDeps(dir),
  });

  if (!result.success) {
    console.error(`Build failed for ${target}`);
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }
  console.log(`Built ${target} → ${target}/dist/`);
}

async function buildShell(): Promise<void> {
  const dir = join(ROOT, "shell");
  const config = readPlatformConfig();
  const importMap = generateRouteImportMap(config);

  const result = await Bun.build({
    entrypoints: [join(dir, "src", "index.ts")],
    outdir: join(dir, "dist"),
    naming: "app.js",
    format: "esm",
    target: "browser",
    external: feDeps(dir),
  });

  if (!result.success) {
    console.error("Shell build failed");
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }

  // Inject route import map + platform config into the HTML template.
  const template = await Bun.file(join(dir, "index.html")).text();
  const importMapTag = `<script type="importmap">\n  ${JSON.stringify(importMap, null, 2)}\n  </script>`;
  const configTag = `<script id="__platform__" type="application/json">\n  ${JSON.stringify(config, null, 2)}\n  </script>`;
  const html = template
    .replace("<!-- __IMPORT_MAP__ -->", importMapTag)
    .replace("<!-- __PLATFORM_CONFIG__ -->", configTag);
  await Bun.write(join(dir, "dist", "index.html"), html);

  console.log("Built shell → shell/dist/");
}
