import * as React from "react";
import { createStore, useStore as useStoreContext } from "zustand";
import { devtools, redux } from "zustand/middleware";

import {
  initialRenderCharts,
  initialState,
  reducer as navigationReducer,
  type NavigationAction,
} from "./navigation-reducer";
import type { NavigationState } from "./types";

export type NavigationStore = ReturnType<typeof createNavigationStore>;

export function createNavigationStore() {
  let renderCharts = Object.assign({}, initialRenderCharts);

  let reducer = (state: NavigationState, action: NavigationAction) => {
    let nextState = navigationReducer(state, action, { renderCharts });
    if (nextState.debugModeEnabled) {
      console.debug(
        `[@rntoolkit/navigation] action: ${action.type}`,
        state,
        nextState
      );
    }
    return { ...nextState };
  };

  let store = createStore(devtools(redux(reducer, initialState)));

  return {
    store: store,
    dispatch: store.dispatch,
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

export function useGetNavigationStore() {
  let context = React.useContext(NavigationStateContext);
  return context.getState
}
