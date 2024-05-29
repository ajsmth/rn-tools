import * as React from "react";
import { createStore, useStore as useStoreContext } from "zustand";

import {
  initialRenderCharts,
  initialState,
  reducer,
  type NavigationAction,
} from "./navigation-reducer";
import type { NavigationState } from "./types";

export type NavigationStore = ReturnType<typeof createNavigationStore>;

export function createNavigationStore() {
  let renderCharts = Object.assign(initialRenderCharts);
  let store = createStore(() => initialState);

  let dispatch = (action: NavigationAction) => {
    store.setState((state) => {
      let nextState = reducer(state, action, { renderCharts });
      return { ...nextState };
    });
  };

  store.subscribe((state) => {
    if (state.debugModeEnabled) {
      console.debug("[@rntoolkit/navigation] state updated: ", {
        state,
        renderCharts,
      });
    }
  });

  return {
    store,
    dispatch,
    renderCharts,
  };
}

export let rootStore = createNavigationStore();

export let NavigationStateContext = React.createContext(rootStore.store);
export let NavigationDispatchContext = React.createContext(rootStore.dispatch);

export function useNavigationState<T>(
  selector?: (state: NavigationState) => T
) {
  let context = React.useContext(NavigationStateContext);
  return useStoreContext(context, selector);
}

export function useNavigationDispatch() {
  let dispatch = React.useContext(NavigationDispatchContext);
  return dispatch;
}
