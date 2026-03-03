import { join, relative } from "path";
import { readFileSync, writeFileSync } from "fs";
import type { Plugin, CliContext, Hooks } from "@fe/core";
import { readPackageMeta } from "../helpers";

async function runLink(ctx: CliContext, hooks: Hooks, args: string[]): Promise<void> {
  const consumer = args[0];
  const dep = args[1];
  if (!consumer || !dep) {
    console.error("Usage: link <consumer> <dep>");
    process.exit(1);
  }

  await hooks.callHook("link:before", consumer, dep);

  const consumerDir = join(ctx.root, consumer);
  const depDir = join(ctx.root, dep);
  const { name: depName } = readPackageMeta(depDir);

  const relToDep = relative(consumerDir, depDir).replace(/\\/g, "/");
  const fileUri = `file:${relToDep.startsWith(".") ? relToDep : `./${relToDep}`}`;

  const pkgPath = join(consumerDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.devDependencies = { ...(pkg.devDependencies ?? {}), [depName]: fileUri };
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  const proc = Bun.spawn(["bun", "install"], { cwd: consumerDir, stdout: "inherit", stderr: "inherit" });
  await proc.exited;

  await hooks.callHook("link:after", consumer, depName);
  console.log(`Linked ${depName} in ${consumer}`);
}

function setupLink(ctx: CliContext, hooks: Hooks): void {
  ctx.commands.set("link", {
    name: "link",
    description: "Wire up a fe() dependency between packages",
    usage: "link <consumer> <dep>",
    run: (args) => runLink(ctx, hooks, args),
  });
}

export const linkPlugin: Plugin = {
  name: "link",
  setup: setupLink,
};
