// Usage (run from repo root):
//   bun cli/src/index.ts build <mfe-a|mfe-b|shell>
//   bun cli/src/index.ts serve [port]
//   bun cli/src/index.ts dev <mfe-a|mfe-b> [port]
//   bun cli/src/index.ts link <consumer> <dep>
//   bun cli/src/index.ts admin upload <mfe-a|mfe-b>

import { bootstrap } from "./core/bootstrap";

const { ctx } = await bootstrap();

const [, , command, ...args] = process.argv;

const cmd = ctx.commands.get(command);
if (!cmd) {
  console.error(`Commands: ${[...ctx.commands.keys()].join(" | ")}`);
  process.exit(1);
}

await cmd.run(args);
