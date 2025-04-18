import { createStore as create, useStore } from "zustand";
import * as React from "react";

/**
 * - safe set
 * - computed api
 * - typings
 * - hooks w/ selectors
 * - batched updates
 * - callbacks?
 * - storage
 * - track update times for each key?
 */

type Options = {
  batchTimeoutMs: number;
};

let defaultOptions: Options = {
  batchTimeoutMs: 50,
};

export function createStore<T extends object>(
  initialState: T,
  options?: Partial<Options>
) {
  let storeInstance = create<T>(() => initialState);

  let pendingUpdates: Partial<T> = {};
  let timerRef: number | undefined | NodeJS.Timeout = undefined;

  let batchTimoutMs = options?.batchTimeoutMs ?? defaultOptions.batchTimeoutMs;

  function safeSet(update: Partial<T>) {
    storeInstance.setState((state) => {
      let nextState = Object.assign(state, {});
      
      for (let field in update) {
        // TODO - deep clone to check for missing
        nextState[field] = update[field];
      }
      
      return nextState;
    });
  }

  function batchUpdate(update: Partial<T>) {
    pendingUpdates = Object.assign(pendingUpdates, update);
    clearTimeout(timerRef);
    timerRef = setTimeout(() => {
      safeSet(pendingUpdates);
      pendingUpdates = {};
    }, batchTimoutMs);
  }

  function setState(update: Partial<T>) {
    batchUpdate(update);
  }

  let selectAll = (state: T) => state;

  function useSelector<S extends T>(selector?: (state: T) => S) {
    return useStore(storeInstance, selector ?? selectAll);
  }

  function useComputed<S, C>(selector: (state: T) => S, fn: (state: S) => C) {
    let slice = useStore(storeInstance, selector);
    let computed = React.useMemo(() => fn(slice), [fn, slice]);
    return computed;
  }

  return {
    setState,
    useSelector,
    useComputed,
    storeInstance,
  };
}
