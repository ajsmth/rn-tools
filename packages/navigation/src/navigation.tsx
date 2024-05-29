import * as React from "react";

import {
  createNavigationStore,
  NavigationDispatchContext,
  NavigationStateContext,
  rootStore,
  type NavigationStore,
} from "./navigation-store";
import type { StackScreenProps } from "./stack";
import type { PushScreenOptions } from "./types";

/**
 * Ideas:
 *  - remove immer - reducer fn easier to test?
 *  - provide initial state?
 *  - monitor rerenders
 *  - warn on parallel stacks?
 *  - lifecycles?
 *  - testing - internal and jest plugin
 */

export function createNavigation() {
  let store = createNavigationStore();
  let navigation = getNavigationFns(store);

  let NavigationContainer = ({ children }: { children: React.ReactNode }) => {
    return (
      <NavigationStateContext.Provider value={store.store}>
        <NavigationDispatchContext.Provider value={store.dispatch}>
          {children}
        </NavigationDispatchContext.Provider>
      </NavigationStateContext.Provider>
    );
  };

  return {
    navigation,
    NavigationContainer,
  };
}

function getNavigationFns({ store, dispatch, renderCharts }: NavigationStore) {
  function getFocusedStackId() {
    let maxDepth = Math.max(
      ...Object.keys(renderCharts.stacksByDepth)
        .filter((key) => renderCharts.stacksByDepth[key].length > 0)
        .map(Number)
    );
    let stackIds = renderCharts.stacksByDepth[maxDepth];

    if (!stackIds || stackIds?.length === 0) {
      if (store.getState().debugModeEnabled) {
        console.warn("No focused stack found");
      }

      return;
    }

    let topStackId = stackIds[stackIds.length - 1];
    return topStackId;
  }

  function getFocusedTabsId() {
    let maxDepth = Math.max(
      ...Object.keys(renderCharts.tabsByDepth)
        .filter((key) => renderCharts.tabsByDepth[key].length > 0)
        .map(Number),
      0
    );
    let tabIds = renderCharts.tabsByDepth[maxDepth];
    let topTabId = tabIds[tabIds.length - 1];
    return topTabId;
  }

  function pushScreen(
    element: React.ReactElement<StackScreenProps>,
    options?: PushScreenOptions
  ) {
    let stackId = options?.stackId || getFocusedStackId();
    let screenId = options?.screenId;

    dispatch({
      type: "PUSH_SCREEN",
      stackId,
      screenId,
      element,
    });

    return screenId;
  }

  function popScreen(count = 1) {
    let stackId = getFocusedStackId();
    let stack = store.getState().stacks.lookup[stackId];
    let numScreens = stack?.screens.length || 0;

    let screensToPop = Math.max(Math.min(numScreens, count), 0);

    dispatch({ type: "POP_SCREEN_BY_COUNT", count: screensToPop, stackId });
    let remainingScreens = count - screensToPop;

    let parentStackId = renderCharts.stackParentsById[stackId];
    let parentStack = store.getState().stacks.lookup[parentStackId];

    while (remainingScreens > 0 && parentStackId && parentStack) {
      let screensToPop = Math.min(parentStack.screens.length, remainingScreens);
      dispatch({
        type: "POP_SCREEN_BY_COUNT",
        count: screensToPop,
        stackId: parentStackId,
      });

      remainingScreens = remainingScreens - screensToPop;
      let nextParentStack = renderCharts.stackParentsById[parentStack.id];

      parentStackId = nextParentStack;
      parentStack = store.getState().stacks.lookup[parentStackId];
    }
  }

  function setTabIndex(index: number, options?: { tabId?: string }) {
    let focusedTabsId = options?.tabId || getFocusedTabsId();
    dispatch({ type: "SET_TAB_INDEX", index, tabId: focusedTabsId });
  }

  function reset() {
    dispatch({ type: "RESET_NAVIGATION" });
  }

  function setDebugModeEnabled(enabled: boolean) {
    dispatch({ type: "SET_DEBUG_MODE", enabled });
  }

  return {
    pushScreen,
    popScreen,
    setTabIndex,
    reset,
    setDebugModeEnabled,
  };
}

let rootNavigation = getNavigationFns(rootStore);
export { rootNavigation as navigation };
