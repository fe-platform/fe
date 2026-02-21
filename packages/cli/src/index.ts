#!/usr/bin/env bun
import { cwd } from "process";
import { bootstrap } from "./bootstrap";

const root = cwd();
const { ctx } = await bootstrap(root);

const [, , command, ...args] = process.argv;

const cmd = ctx.commands.get(command);
if (!cmd) {
  console.error(`Commands: ${[...ctx.commands.keys()].join(" | ")}`);
  process.exit(1);
}

await cmd.run(args);
