import { join } from "path";
import { ROOT, readImportMap } from "./config";

// Builds mfe-a, mfe-b, or shell into their respective dist/ folders.
// All fe:* imports are marked as external — the import map handles them at runtime.
export async function build(target: string): Promise<void> {
  if (target === "shell") return buildShell();

  const dir = join(ROOT, target);
  const result = await Bun.build({
    entrypoints: [join(dir, "src", "index.ts")],
    outdir: join(dir, "dist"),
    format: "esm",
    target: "browser",
    // fe:* specifiers are NOT bundled — resolved at runtime via import map.
    external: ["fe:*"],
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
  const importMap = readImportMap();

  // Bundle shell JS; fe:* deps are external, resolved via the injected import map.
  const result = await Bun.build({
    entrypoints: [join(dir, "src", "index.ts")],
    outdir: join(dir, "dist"),
    naming: "app.js",
    format: "esm",
    target: "browser",
    external: ["fe:*"],
  });

  if (!result.success) {
    console.error("Shell build failed");
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }

  // Inject import map into the HTML template.
  const template = await Bun.file(join(dir, "index.html")).text();
  const scriptTag = `<script type="importmap">\n  ${JSON.stringify(importMap, null, 2)}\n  </script>`;
  const html = template.replace("<!-- __IMPORT_MAP__ -->", scriptTag);
  await Bun.write(join(dir, "dist", "index.html"), html);

  console.log("Built shell → shell/dist/");
}
