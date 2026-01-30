import * as React from "react";
import useSyncExternalStoreExports from "use-sync-external-store/shim/with-selector";

const { useSyncExternalStoreWithSelector } = useSyncExternalStoreExports;

export class Store<T> {
  private readonly listeners = new Set<() => void>();
  private state: T;
  private readonly initialState: T;

  constructor(initialState: T) {
    this.state = initialState;
    this.initialState = initialState;
  }

  getState = () => this.state;
  getInitialState = () => this.initialState;

  setState = (nextState: T | ((prevState: T) => T)) => {
    const resolved =
      typeof nextState === "function"
        ? (nextState as (prevState: T) => T)(this.state)
        : nextState;

    if (Object.is(resolved, this.state)) {
      return;
    }

    this.state = resolved;
    this.listeners.forEach((listener) => listener());
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
}

export type StoreApi<T> = Store<T>;

export function useStore<T, S = T>(
  store: Store<T>,
  selector: (state: T) => S = (state) => state as S,
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
    <StoreContext.Provider value={props.store as Store<unknown>}>
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
