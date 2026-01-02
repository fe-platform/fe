#!/usr/bin/env bun

/**
 * create-fe-platform - Scaffold generator for FE platform Metal layer
 *
 * Usage: npx create-fe-platform <project-name>
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

interface ScaffoldOptions {
  name: string;
  targetDir: string;
}

async function scaffold(options: ScaffoldOptions): Promise<void> {
  const { name, targetDir } = options;

  console.log(`Creating FE platform scaffold: ${name}`);

  // Create directory structure
  await mkdir(targetDir, { recursive: true });
  await mkdir(join(targetDir, "config"), { recursive: true });
  await mkdir(join(targetDir, "mfes"), { recursive: true });

  // Create package.json
  const packageJson = {
    name,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "fe dev",
      build: "fe build",
      test: "fe test",
    },
    devDependencies: {
      "@fe/cli-core": "^0.1.0",
    },
  };

  await writeFile(
    join(targetDir, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );

  // Create platform.json
  const platformJson = {
    name,
    version: "1.0.0",
    configVersion: "1.0.0",
    mfes: {},
  };

  await writeFile(
    join(targetDir, "config", "platform.json"),
    JSON.stringify(platformJson, null, 2)
  );

  // Create environments.json
  const environmentsJson = {
    environments: {
      development: {
        registry: "http://localhost:3000",
      },
      production: {
        registry: "https://registry.example.com",
      },
    },
  };

  await writeFile(
    join(targetDir, "config", "environments.json"),
    JSON.stringify(environmentsJson, null, 2)
  );

  // Create README
  const readme = `# ${name}

FE Platform scaffold created with create-fe-platform.

## Getting Started

\`\`\`bash
# Install dependencies
bun install

# Start development server
bun run dev
\`\`\`

## Next Steps

1. Add your first MFE in the \`mfes/\` directory
2. Configure platform settings in \`config/platform.json\`
3. Set up environments in \`config/environments.json\`

For more information, see the FE Platform documentation.
`;

  await writeFile(join(targetDir, "README.md"), readme);

  console.log(`\n✓ Scaffold created successfully!`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${name}`);
  console.log(`  bun install`);
  console.log(`  bun run dev\n`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Error: Project name required");
    console.log("Usage: npx create-fe-platform <project-name>");
    process.exit(1);
  }

  const name = args[0]!;
  const targetDir = join(process.cwd(), name);

  await scaffold({ name, targetDir });
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
