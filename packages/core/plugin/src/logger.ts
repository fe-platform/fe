import type { Logger } from "./types.ts";

/**
 * Creates a simple console-based logger.
 */
export function createLogger(name: string): Logger {
  const prefix = `[${name}]`;

  return {
    debug(message: string, ...args: unknown[]): void {
      console.debug(prefix, message, ...args);
    },

    info(message: string, ...args: unknown[]): void {
      console.info(prefix, message, ...args);
    },

    warn(message: string, ...args: unknown[]): void {
      console.warn(prefix, message, ...args);
    },

    error(message: string, ...args: unknown[]): void {
      console.error(prefix, message, ...args);
    },
  };
}
