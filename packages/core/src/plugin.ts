import type { CliContext } from "./context";
import type { Hooks } from "./hooks";

export interface Plugin {
  name: string;
  /**
   * Declares what `fe` should do when the installed version of this plugin
   * is behind the latest published version on the npm registry.
   *
   * - `"warn"`: print a warning and continue.
   * - `"block"`: abort with an error.
   *
   * Omit to take no action on outdated installs.
   */
  updatePolicy?: {
    onOutdated: "warn" | "block";
  };
  setup(ctx: CliContext, hooks: Hooks): void | Promise<void>;
}
