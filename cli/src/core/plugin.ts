import type { CliContext } from "./context";
import type { Hooks } from "./hooks";

export interface Plugin {
  /** Unique name, e.g. "build", "serve", "admin" */
  name: string;
  /**
   * Called once during CLI bootstrap.
   * The plugin registers its hooks, commands, and adapters here.
   */
  setup(ctx: CliContext, hooks: Hooks): void | Promise<void>;
}
