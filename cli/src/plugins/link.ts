import { join, relative } from "path";
import { readFileSync, writeFileSync } from "fs";
import type { Plugin } from "../core/plugin";
import { readPackageMeta } from "../core/helpers";

// --- Hook declarations ---

declare module "../core/hooks" {
  interface HookMap {
    "link:before": [consumer: string, dep: string];
    "link:after": [consumer: string, depName: string];
  }
}

// --- Plugin ---

export const linkPlugin: Plugin = {
  name: "link",
  setup(ctx, hooks) {
    ctx.commands.set("link", {
      name: "link",
      description: "Wire up a fe() dependency between packages",
      usage: "link <consumer> <dep>",
      async run(args) {
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

        const proc = Bun.spawn(["bun", "install"], {
          cwd: consumerDir,
          stdout: "inherit",
          stderr: "inherit",
        });
        await proc.exited;

        await hooks.callHook("link:after", consumer, depName);
        console.log(`Linked ${depName} in ${consumer}`);
      },
    });
  },
};
