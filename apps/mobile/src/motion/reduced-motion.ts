import { AccessibilityInfo } from 'react-native';

/** Where the Reduce Motion setting comes from. Injected so races and failures can be tested. */
export interface ReducedMotionSource {
  query(): Promise<boolean>;
  subscribe(listener: (enabled: boolean) => void): () => void;
}

export interface ReducedMotionStore {
  /** `null` until the platform has answered. */
  getSnapshot(): boolean | null;
  subscribe(listener: () => void): () => void;
}

/** The operating system setting: iOS Reduce Motion, Android "Remove animations", or the web media query. */
export const systemReducedMotionSource: ReducedMotionSource = {
  query: () => AccessibilityInfo.isReduceMotionEnabled(),
  subscribe(listener) {
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', listener);
    return () => subscription.remove();
  },
};

/**
 * Follows the setting live while anything is listening. A change event always beats a slower first
 * answer, and an answer that arrives after the last listener left is ignored.
 */
export function createReducedMotionStore(source: ReducedMotionSource): ReducedMotionStore {
  let reduced: boolean | null = null;
  let detach: (() => void) | undefined;
  let generation = 0;
  const listeners = new Set<() => void>();

  function update(next: boolean) {
    if (next === reduced) return;
    reduced = next;
    listeners.forEach((listener) => listener());
  }

  function attach() {
    const current = ++generation;
    let heardChange = false;
    detach = source.subscribe((enabled) => {
      heardChange = true;
      update(enabled);
    });
    Promise.resolve()
      .then(() => source.query())
      .then(
        (enabled) => { if (current === generation && !heardChange) update(enabled); },
        () => {
          // The platform could not answer. Keep the last known value; until there is one,
          // useReducedMotion falls back to the setting Reanimated read at launch.
        },
      );
  }

  return {
    getSnapshot: () => reduced,
    subscribe(listener) {
      listeners.add(listener);
      if (!detach) attach();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && detach) {
          detach();
          detach = undefined;
          generation++;
        }
      };
    },
  };
}

/** A store that never changes, for tests and design previews. */
export function fixedReducedMotionStore(reduced: boolean): ReducedMotionStore {
  return { getSnapshot: () => reduced, subscribe: () => () => {} };
}

/**
 * The native-stack transition for a layout to use. With Reduce Motion on, screen changes happen at
 * once instead of sliding (PRD §23.1).
 */
export function stackAnimation(reduced: boolean): 'none' | 'default' {
  return reduced ? 'none' : 'default';
}
