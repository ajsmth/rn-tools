import * as React from "react";
import useSyncExternalStoreExports from "use-sync-external-store/shim/with-selector";

const { useSyncExternalStoreWithSelector } = useSyncExternalStoreExports;

export type Store<T> = {
  getState: () => T;
  getInitialState: () => T;
  setState: (nextState: T | ((prevState: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
};

export type StoreApi<T> = Store<T>;

export function createStore<T>(initialState: T): Store<T> {
  const listeners = new Set<() => void>();
  let state = initialState;

  const getState = () => state;
  const getInitialState = () => initialState;

  const setState = (nextState: T | ((prevState: T) => T)) => {
    const resolved =
      typeof nextState === "function"
        ? (nextState as (prevState: T) => T)(state)
        : nextState;

    if (Object.is(resolved, state)) {
      return;
    }

    state = resolved;
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { getState, getInitialState, setState, subscribe };
}

export function useStore<T, S = T>(
  store: Store<T>,
  selector: (state: T) => S = (state) => state as unknown as S,
  isEqual: (left: S, right: S) => boolean = Object.is,
): S {
  const slice = useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getState,
    store.getInitialState,
    selector,
    isEqual,
  );
  React.useDebugValue(slice);
  return slice;
}

export const StoreContext = React.createContext<Store<unknown> | null>(null);

export function StoreProvider<T>(props: {
  store: Store<T>;
  children: React.ReactNode;
}) {
  return (
    <StoreContext.Provider value={props.store}>
      {props.children}
    </StoreContext.Provider>
  );
}

export function useStoreContext<T, S = T>(
  selector?: (state: T) => S,
  isEqual?: (left: S, right: S) => boolean,
) {
  const store = React.useContext(StoreContext) as Store<T> | null;
  if (!store) {
    throw new Error("StoreProvider is missing from the component tree.");
  }
  return useStore(store, selector, isEqual);
}
