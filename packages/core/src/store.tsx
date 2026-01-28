import * as React from "react";
import useSyncExternalStoreExports from "use-sync-external-store/shim/with-selector";

const { useSyncExternalStoreWithSelector } = useSyncExternalStoreExports;

export type Store<T> = {
  getState: () => T;
  getInitialState: () => T;
  setState: (nextState: T | ((prevState: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createStore<T>(initialState: T): Store<T> {
  let state = initialState;
  const initial = initialState;
  const listeners = new Set<() => void>();

  const getState = () => state;
  const getInitialState = () => initial;

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

export function useStoreSelector<T, S>(
  store: Store<T>,
  selector: (state: T) => S,
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

export function createStoreContext<T>() {
  const StoreContext = React.createContext<Store<T> | null>(null);

  function StoreProvider(props: { store: Store<T>; children: React.ReactNode }) {
    return (
      <StoreContext.Provider value={props.store}>
        {props.children}
      </StoreContext.Provider>
    );
  }

  function useStore() {
    const store = React.useContext(StoreContext);
    if (!store) {
      throw new Error("StoreProvider is missing from the component tree.");
    }
    return store;
  }

  function useStoreSelectorFromContext<S>(
    selector: (state: T) => S,
    isEqual?: (left: S, right: S) => boolean,
  ) {
    return useStoreSelector(useStore(), selector, isEqual);
  }

  return { StoreProvider, useStore, useStoreSelector: useStoreSelectorFromContext };
}
