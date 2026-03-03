import { join } from "path";
import type { Plugin, CliContext, Hooks, PackageVersion } from "@fe/core";
import { readPackageMeta, readFeDeps, slugFromSpecifier } from "../helpers";

async function adminUpload(ctx: CliContext, hooks: Hooks, target: string): Promise<void> {
  const dir = join(ctx.root, target);
  const distDir = join(dir, "dist");

  if (!Bun.file(join(distDir, "index.js")).size) {
    console.error(`No dist/index.js found for ${target}. Run: fe build ${target}`);
    process.exit(1);
  }

  const { name, version } = readPackageMeta(dir);
  const slug = slugFromSpecifier(name);

  await hooks.callHook("admin:upload:before", target, { name, version });

  const url = await ctx.adapters.artifactStorage.upload(slug, version, distDir);

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
  await ctx.adapters.manifest.registerPackage(name, version, entry);
  await hooks.callHook("admin:register:after");
  await hooks.callHook("admin:upload:after", target, url, deps);

  console.log(`Uploaded ${name}@${version}`);
  console.log(`URL: ${url}`);
  console.log(`Deps: ${Object.keys(deps).length === 0 ? "(none)" : Object.keys(deps).join(", ")}`);
  console.log(`\nRegistered in manifest. Update "routes" to activate for a path.`);
}

async function runAdmin(ctx: CliContext, hooks: Hooks, args: string[]): Promise<void> {
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
}

function setupAdmin(ctx: CliContext, hooks: Hooks): void {
  ctx.commands.set("admin", {
    name: "admin",
    description: "Admin operations (upload artifacts)",
    usage: "admin upload <target>",
    run: (args) => runAdmin(ctx, hooks, args),
  });
}

export const adminPlugin: Plugin = {
  name: "admin",
  setup: setupAdmin,
};
