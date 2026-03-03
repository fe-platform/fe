export type Listener<T> = (value: T) => void;
export type Unsubscribe = () => void;
export type Updater<T> = T | ((prev: T) => T);

export interface Store<T> {
  /** Returns the current value. */
  get(): T;
  /** Replaces the current value (or pass a function to derive from previous). */
  set(updater: Updater<T>): void;
  /** Subscribes to value changes. Returns an unsubscribe function. */
  subscribe(listener: Listener<T>): Unsubscribe;
}

const registry = new Map<string, Store<unknown>>();

/**
 * Returns a named store scoped to `key`.
 *
 * All MFEs that call `createStore` with the same `key` share one instance:
 * the import map ensures a single module URL is loaded, giving one registry.
 *
 * `init` is used only when the store is first created; subsequent calls with
 * the same key return the existing store and ignore `init`.
 */
export function createStore<T>(key: string, init: T): Store<T> {
  if (registry.has(key)) return registry.get(key) as Store<T>;

  let value = init;
  const listeners = new Set<Listener<T>>();

  const store: Store<T> = {
    get: () => value,
    set(updater: Updater<T>): void {
      const next = typeof updater === "function"
        ? (updater as (prev: T) => T)(value)
        : updater;
      if (Object.is(next, value)) return;
      value = next;
      for (const fn of listeners) fn(value);
    },
    subscribe(listener: Listener<T>): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  registry.set(key, store as Store<unknown>);
  return store;
}

/**
 * Returns the store registered under `key`, or `null` if none exists yet.
 * Useful for read-only access without triggering store creation.
 */
export function getStore<T>(key: string): Store<T> | null {
  return (registry.get(key) as Store<T>) ?? null;
}
