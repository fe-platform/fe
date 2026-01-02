import type { Hook, HookCallback } from "./types.ts";

/**
 * Creates a hook that allows plugins to register callbacks.
 * Callbacks are called in registration order.
 */
export function createHook<T>(): Hook<T> {
  const callbacks: Array<{ name: string; callback: HookCallback<T> }> = [];

  return {
    tap(name: string, callback: HookCallback<T>): void {
      callbacks.push({ name, callback });
    },

    async call(context: T): Promise<T> {
      let result = context;

      for (const { callback } of callbacks) {
        const callbackResult = await callback(result);
        if (callbackResult !== undefined) {
          result = callbackResult;
        }
      }

      return result;
    },
  };
}
