import { join, relative } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { ROOT, readPackageMeta } from "./config";

// Wires up TypeScript types between a consumer and a fe: dependency.
//
// What it does:
//   1. Adds the dep as a devDependency with a file: URI in consumer/package.json.
//      For separate repos, swap file: for a git URI — the rest is identical:
//        "git+https://github.com/org/mfe-a#v1.0.0"
//      The dep's package.json must have "types": "dist/index.d.ts" in that case
//      (run `bun cli/src/index.ts build <mfe>` which emits declarations).
//   2. Adds a tsconfig paths entry mapping fe:<name> → the dep's source file,
//      so the TypeScript language server resolves types without node_modules.
//   3. Creates a minimal tsconfig.json in the consumer if one doesn't exist.
//   4. Runs `bun install` in the consumer directory.
export async function link(consumerTarget: string, depTarget: string): Promise<void> {
  const consumerDir = join(ROOT, consumerTarget);
  const depDir = join(ROOT, depTarget);

  const { name: depName } = readPackageMeta(depDir);
  const feSpecifier = `fe:${depName}`;

  // For local file: deps the path is relative to the consumer package dir.
  const relToDep = relative(consumerDir, depDir).replace(/\\/g, "/");
  const fileUri = `file:${relToDep.startsWith(".") ? relToDep : `./${relToDep}`}`;

  // tsconfig paths points directly at source — no bun install required for types.
  const relToSrc = relative(consumerDir, join(depDir, "src", "index.ts")).replace(/\\/g, "/");
  const srcPath = relToSrc.startsWith(".") ? relToSrc : `./${relToSrc}`;

  updatePackageJson(consumerDir, depName, fileUri);
  updateTsconfig(consumerDir, feSpecifier, srcPath);

  const proc = Bun.spawn(["bun", "install"], {
    cwd: consumerDir,
    stdout: "inherit",
    stderr: "inherit",
  });
  await proc.exited;

  console.log(`Linked ${feSpecifier} → ${srcPath} in ${consumerTarget}/tsconfig.json`);
}

function updatePackageJson(dir: string, depName: string, fileUri: string): void {
  const pkgPath = join(dir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.devDependencies = { ...(pkg.devDependencies ?? {}), [depName]: fileUri };
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

function updateTsconfig(dir: string, feSpecifier: string, srcPath: string): void {
  const tsconfigPath = join(dir, "tsconfig.json");
  const tsconfig = existsSync(tsconfigPath)
    ? JSON.parse(readFileSync(tsconfigPath, "utf8"))
    : defaultTsconfig();

  tsconfig.compilerOptions ??= {};
  tsconfig.compilerOptions.paths ??= {};
  tsconfig.compilerOptions.paths[feSpecifier] = [srcPath];
  writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + "\n");
}

function defaultTsconfig() {
  return {
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "bundler",
      strict: true,
      lib: ["ES2022", "DOM"],
      paths: {},
    },
    include: ["src"],
  };
}
