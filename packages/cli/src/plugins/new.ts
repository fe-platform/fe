import { join } from "path";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import type { CliContext, CommandDef } from "@fe/core";
import type { Hooks } from "@fe/core";

const TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "bundler",
      strict: true,
      skipLibCheck: true,
      lib: ["ES2022", "DOM"],
    },
    include: ["src"],
  },
  null,
  2
);

const INDEX_TS = `export function render(
  container: HTMLElement,
  _props: Record<string, unknown>
): () => void {
  const el = document.createElement("div");
  el.textContent = "Hello from <NAME>";
  container.appendChild(el);
  return () => el.remove();
}
`;

function buildPackageJson(specifier: string, slug: string): string {
  return JSON.stringify(
    {
      name: specifier,
      version: "0.1.0",
      module: "src/index.ts",
      scripts: {
        build: `fe build ${slug}`,
        check: `fe check ${slug}`,
      },
      devDependencies: {
        "@fe/cli": "workspace:*",
      },
      fe: {
        plugins: [],
        jitPlugins: [],
      },
    },
    null,
    2
  );
}

async function runNew(ctx: CliContext, args: string[]): Promise<void> {
  const name = args[0];
  if (!name || name.includes("fe(") || name.includes("@")) {
    console.error('Usage: fe new <scope/name>  (e.g. "fe new conqueso/my-mfe")');
    process.exit(1);
  }

  const [scope, nameOnly] = name.includes("/") ? name.split("/") : ["", name];
  const specifier = scope ? `@${scope}/fe-${nameOnly}` : `fe-${nameOnly}`;
  const slug = nameOnly;
  const dir = join(ctx.root, slug);

  if (existsSync(dir)) {
    console.error(`Directory already exists: ${dir}`);
    process.exit(1);
  }

  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), buildPackageJson(specifier, slug));
  writeFileSync(join(dir, "tsconfig.json"), TSCONFIG);
  writeFileSync(
    join(dir, "src", "index.ts"),
    INDEX_TS.replace("<NAME>", specifier)
  );

  console.log(`Created ${specifier} at ${dir}`);
  console.log(`  package.json — name, version, scripts, "fe" config key`);
  console.log(`  tsconfig.json`);
  console.log(`  src/index.ts  — render() stub`);
}

export const newPlugin = {
  name: "new",
  setup(ctx: CliContext, _hooks: Hooks): void {
    const cmd: CommandDef = {
      name: "new",
      description: "Scaffold a new MFE project",
      usage: "fe new <scope/name>",
      run: (args) => runNew(ctx, args),
    };
    ctx.commands.set("new", cmd);
  },
};
