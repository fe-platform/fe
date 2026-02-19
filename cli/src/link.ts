import { join, relative } from "path";
import { readFileSync, writeFileSync } from "fs";
import { ROOT, readPackageMeta } from "./config";

// Wires up a fe() dependency between a consumer and a dep.
//
// What it does:
//   1. Adds the dep as a devDependency with a file: URI in consumer/package.json.
//   2. Runs `bun install` — Bun creates node_modules/fe(@acme/dep-name) as a symlink.
//
// TypeScript resolves fe(@acme/mfe-a) directly from node_modules without any
// tsconfig paths config, because the package name IS the import specifier.
//
// For separate repos: swap file:../mfe-a for a git URI — nothing else changes.
//   "fe(@acme/mfe-a)": "git+https://github.com/org/mfe-a#v1.0.0"
export async function link(consumerTarget: string, depTarget: string): Promise<void> {
  const consumerDir = join(ROOT, consumerTarget);
  const depDir = join(ROOT, depTarget);

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

  console.log(`Linked ${depName} in ${consumerTarget}`);
}
