/**
 * Minimal typed hook system. Plugins declare hooks via declaration merging
 * on the HookMap interface, giving full type safety with zero dependencies.
 */

// Extended via declaration merging by each plugin.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface HookMap {}

type HookName = keyof HookMap & string;
type HookHandler<K extends HookName> = (...args: HookMap[K] extends unknown[] ? HookMap[K] : never) => void | Promise<void>;

export class Hooks {
  private handlers = new Map<string, Array<{ fn: Function; priority: number }>>();

  /**
   * Register a handler for a named hook.
   * Lower priority numbers run first (default 10).
   */
  hook<K extends HookName>(name: K, fn: HookHandler<K>, priority = 10): void {
    if (!this.handlers.has(name)) this.handlers.set(name, []);
    this.handlers.get(name)!.push({ fn, priority });
    this.handlers.get(name)!.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Call all handlers for a hook sequentially (async series).
   */
  async callHook<K extends HookName>(name: K, ...args: HookMap[K] extends unknown[] ? HookMap[K] : never): Promise<void> {
    const list = this.handlers.get(name) ?? [];
    for (const { fn } of list) {
      await fn(...args);
    }
  }

  /**
   * Waterfall: each handler receives a value and returns a (possibly
   * transformed) value that is passed to the next handler.
   */
  async waterfall<T>(name: string, initial: T): Promise<T> {
    const list = this.handlers.get(name) ?? [];
    let value = initial;
    for (const { fn } of list) {
      value = (await fn(value)) ?? value;
    }
    return value;
  }
}
