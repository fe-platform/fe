import type { CliContext } from "./context";
import type { Hooks } from "./hooks";

export interface Plugin {
  name: string;
  setup(ctx: CliContext, hooks: Hooks): void | Promise<void>;
}
