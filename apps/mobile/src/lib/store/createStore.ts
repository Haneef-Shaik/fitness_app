/**
 * A minimal external store, read through React's own `useSyncExternalStore`.
 *
 * **Why not Zustand.** It was tried, at v5 and then v4, and both crashed this app
 * the moment a component subscribed: `Cannot read properties of null (reading
 * 'useRef')` — React resolving to null inside the library. That is the same
 * failure shape `@shopify/flash-list` produced in G2, and the common factor is a
 * dependency reaching for React through its own import under Metro's web
 * bundling. Web is the only target this project can currently run (DR4), so a
 * library that breaks it is not usable here whatever it does on a device.
 *
 * `useSyncExternalStore` is React's own API and ships with React 18, so there is
 * no interop to get wrong. This file is the entire state library. The reducers
 * were always where the logic lived — see
 * features/workout-session/store/reducers.ts — and they did not change when this
 * did, which is rather the point of having kept them pure.
 */
import { useCallback, useSyncExternalStore } from 'react';

export type Listener = () => void;

export interface StoreApi<T> {
  getState(): T;
  setState(partial: Partial<T> | ((s: T) => Partial<T>)): void;
  subscribe(listener: Listener): () => void;
}

export type UseStore<T> = (<S>(selector: (s: T) => S) => S) & StoreApi<T>;

export function createStore<T extends object>(
  init: (set: StoreApi<T>['setState'], get: () => T) => T,
): UseStore<T> {
  let state: T;
  const listeners = new Set<Listener>();

  const setState: StoreApi<T>['setState'] = (partial) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    // Reference equality per key: the reducers return new objects when something
    // changed and the same object when nothing did, so this is exact.
    const changed = (Object.keys(next) as Array<keyof T>)
      .some((k) => !Object.is(state[k], next[k]));
    if (!changed) return;

    state = { ...state, ...next };
    for (const l of [...listeners]) l();
  };

  const getState = () => state;

  const subscribe = (listener: Listener) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  };

  state = init(setState, getState);

  function useStore<S>(selector: (s: T) => S): S {
    const getSnapshot = useCallback(() => selector(getState()), [selector]);
    // Third argument is the server snapshot; on this client they are the same.
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  }

  return Object.assign(useStore as <S>(selector: (s: T) => S) => S, {
    getState, setState, subscribe,
  });
}
