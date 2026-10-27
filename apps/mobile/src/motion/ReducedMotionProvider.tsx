import { createContext, useContext, useSyncExternalStore, type PropsWithChildren } from 'react';
import { useReducedMotion as useLaunchReducedMotion } from 'react-native-reanimated';
import { createReducedMotionStore, systemReducedMotionSource, type ReducedMotionStore } from './reduced-motion';

const systemStore = createReducedMotionStore(systemReducedMotionSource);
const ReducedMotionContext = createContext<ReducedMotionStore>(systemStore);

/** The app needs no provider: it follows the system setting. Tests and previews pass their own store. */
export function ReducedMotionProvider({ store, children }: PropsWithChildren<{ store: ReducedMotionStore }>) {
  return <ReducedMotionContext.Provider value={store}>{children}</ReducedMotionContext.Provider>;
}

/**
 * The one Reduce Motion answer for the app. Reanimated's own hook reads the setting only at launch,
 * so this one follows changes live, and uses the launch reading until the platform first answers.
 */
export function useReducedMotion(): boolean {
  const atLaunch = useLaunchReducedMotion();
  const store = useContext(ReducedMotionContext);
  const live = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return live ?? atLaunch;
}
