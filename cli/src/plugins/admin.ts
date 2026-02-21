import { join } from "path";
import type { Plugin } from "../core/plugin";
import type { PackageVersion } from "../core/types";
import { readPackageMeta, readFeDeps, slugFromSpecifier } from "../core/helpers";

// --- Hook declarations ---

declare module "../core/hooks" {
  interface HookMap {
    "admin:upload:before": [target: string, meta: { name: string; version: string }];
    "admin:upload:after": [target: string, url: string, deps: Record<string, string>];
    "admin:register:before": [specifier: string, version: string, entry: PackageVersion];
    "admin:register:after": [];
  }
}

// --- Plugin ---

export const adminPlugin: Plugin = {
  name: "admin",
  setup(ctx, hooks) {
    ctx.commands.set("admin", {
      name: "admin",
      description: "Admin operations (upload artifacts)",
      usage: "admin upload <target>",
      async run(args) {
        const subcommand = args[0];
        if (subcommand === "upload") {
          const target = args[1];
          if (!target) {
            console.error("Usage: admin upload <target>");
            process.exit(1);
          }
          await adminUpload(ctx, hooks, target);
        } else {
          console.error("Unknown admin subcommand. Available: upload");
          process.exit(1);
        }
      },
    });
  },
};

async function adminUpload(
  ctx: import("../core/context").CliContext,
  hooks: import("../core/hooks").Hooks,
  target: string,
): Promise<void> {
  const dir = join(ctx.root, target);
  const distDir = join(dir, "dist");

  if (!Bun.file(join(distDir, "index.js")).size) {
    console.error(`No dist/index.js found for ${target}. Run: bun cli/src/index.ts build ${target}`);
    process.exit(1);
  }

  const { name, version } = readPackageMeta(dir);
  const slug = slugFromSpecifier(name);

  await hooks.callHook("admin:upload:before", target, { name, version });

  // Use ArtifactStorage adapter instead of hardcoded cpSync.
  const url = await ctx.adapters.artifactStorage.upload(slug, version, distDir);

  // Resolve fe() deps -> semver ranges for the platform config.
  const rawFeDeps = readFeDeps(dir);
  const deps: Record<string, string> = {};
  for (const depSpecifier of Object.keys(rawFeDeps)) {
    const depSlug = slugFromSpecifier(depSpecifier);
    const depDir = join(ctx.root, depSlug);
    try {
      const depMeta = readPackageMeta(depDir);
      deps[depSpecifier] = `^${depMeta.version}`;
    } catch {
      console.warn(`  Warning: could not resolve version for ${depSpecifier}, skipping dep.`);
    }
  }

  const entry: PackageVersion = { url, deps };
  await hooks.callHook("admin:register:before", name, version, entry);

  // Use ManifestManager adapter instead of direct JSON read/write.
  await ctx.adapters.manifest.registerPackage(name, version, entry);

  await hooks.callHook("admin:register:after");
  await hooks.callHook("admin:upload:after", target, url, deps);

  console.log(`Uploaded ${name}@${version}`);
  console.log(`URL: ${url}`);
  console.log(`Deps: ${Object.keys(deps).length === 0 ? "(none)" : Object.keys(deps).join(", ")}`);
  console.log(``);
  console.log(`Registered in configs/platform.json`);
  console.log(`To activate for a route, update the "routes" section.`);
}
