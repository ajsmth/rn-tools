import * as React from "react";
import { ScreenProps as RNScreenProps } from "react-native-screens";

import type {
  NavigationState,
  PushScreenOptions,
  RenderCharts,
  StackItem,
  ScreenItem,
  TabItem,
} from "./types";
import {
  generateScreenId,
  generateStackId,
  generateTabId,
  serializeTabIndexKey,
} from "./utils";

const DEFAULT_SLOT_NAME = "DEFAULT_SLOT";

type CreateStackAction = {
  type: "CREATE_STACK_INSTANCE";
  stackId?: string;
  defaultSlotName?: string;
};

type RegisterStackAction = {
  type: "REGISTER_STACK";
  depth: number;
  isActive: boolean;
  stackId: string;
  parentStackId: string;
  parentTabId: string;
  tabIndex: number;
};

type UnregisterStackAction = {
  type: "UNREGISTER_STACK";
  stackId: string;
};

type PushScreenStackAction = {
  type: "PUSH_SCREEN";
  element: React.ReactElement<RNScreenProps>;
  options: PushScreenOptions;
};

type PopScreenByCountAction = {
  type: "POP_SCREEN_BY_COUNT";
  count: number;
  stackId: string;
};

type PopScreenByKeyAction = {
  type: "POP_SCREEN_BY_KEY";
  key: string;
};

type StackActions =
  | CreateStackAction
  | RegisterStackAction
  | UnregisterStackAction
  | PushScreenStackAction
  | PopScreenByCountAction
  | PopScreenByKeyAction;

type CreateTabAction = {
  type: "CREATE_TAB_INSTANCE";
  tabId?: string;
  initialActiveIndex?: number;
};

type SetTabIndexAction = {
  type: "SET_TAB_INDEX";
  index: number;
  tabId: string;
};

type RegisterTabAction = {
  type: "REGISTER_TAB";
  depth: number;
  tabId: string;
  isActive: boolean;
  parentTabId?: string;
};

type UnregisterTabAction = {
  type: "UNREGISTER_TAB";
  tabId: string;
};

type TabBackAction = {
  type: "TAB_BACK";
  tabId: string;
};

type TabActions =
  | CreateTabAction
  | SetTabIndexAction
  | RegisterTabAction
  | UnregisterTabAction
  | TabBackAction;

export type NavigationAction = StackActions | TabActions;

export function reducer(
  state: NavigationState,
  action: NavigationAction,
  context: { renderCharts: RenderCharts }
): NavigationState {
  switch (action.type) {
    case "CREATE_STACK_INSTANCE": {
      action.stackId = action.stackId || generateStackId();

      let initialStack: StackItem = {
        id: action.stackId,
        defaultSlotName: action.defaultSlotName || DEFAULT_SLOT_NAME,
        screens: [],
      };

      return Object.assign(state, {
        stacks: {
          ids: state.stacks.ids
            .filter((id) => id !== initialStack.id)
            .concat(initialStack.id),
          lookup: Object.assign({}, state.stacks.lookup, {
            [action.stackId]: initialStack,
          }),
        },
      });
    }

    case "REGISTER_STACK": {
      let { depth, isActive, stackId, parentStackId, parentTabId, tabIndex } =
        action;
      let { renderCharts } = context;

      renderCharts.stacksByDepth[depth] =
        renderCharts.stacksByDepth[depth] || [];

      Object.keys(renderCharts.stacksByDepth).forEach((depth) => {
        renderCharts.stacksByDepth[depth] = renderCharts.stacksByDepth[
          depth
        ].filter((id) => id !== stackId);
      });

      if (isActive && !renderCharts.stacksByDepth[depth].includes(stackId)) {
        renderCharts.stacksByDepth[depth].push(stackId);
      }

      if (parentStackId) {
        renderCharts.stackParentsById[stackId] = parentStackId;
      }

      if (parentTabId) {
        let tabIndexKey = serializeTabIndexKey(parentTabId, tabIndex);
        renderCharts.stacksByTabIndex[tabIndexKey] =
          renderCharts.stacksByTabIndex[tabIndexKey] || [];

        if (!renderCharts.stacksByTabIndex[tabIndexKey].includes(stackId)) {
          renderCharts.stacksByTabIndex[tabIndexKey].push(stackId);
        }
      }

      return state;
    }

    case "UNREGISTER_STACK": {
      let { stackId } = action;
      let { renderCharts } = context;

      for (let depth in renderCharts.stacksByDepth) {
        renderCharts.stacksByDepth[depth] = renderCharts.stacksByDepth[
          depth
        ].filter((id) => id !== stackId);
      }

      let stack = state.stacks.lookup[stackId];

      if (stack && renderCharts.stackParentsById[stackId] != null) {
        let nextState = Object.assign(state, {});

        stack.screens.forEach((screenId) => {
          delete nextState.screens.lookup[screenId];
          nextState.screens.ids = nextState.screens.ids.filter(
            (id) => id !== screenId
          );
        });

        nextState.stacks = {
          ids: state.stacks.ids.filter((id) => id !== stackId),
          lookup: Object.assign({}, state.stacks.lookup, {
            [stackId]: undefined,
          }),
        };

        return Object.assign(state, nextState);
      }

      return state;
    }

    case "PUSH_SCREEN": {
      let { element, options } = action;
      let stack = state.stacks.lookup[options.stackId ?? ""];

      if (!stack) {
        if (state.debugModeEnabled) {
          console.warn("Stack not found: ", options.stackId);
        }
        return state;
      }

      if (options.key && state.screens.lookup[options.key] != null) {
        return state;
      }

      let screenItem: ScreenItem = {
        element,
        slotName: options.slotName || stack.defaultSlotName,
        id: options.key || generateScreenId(),
        stackId: stack.id,
      };

      let nextState = Object.assign(state, {
        screens: {
          ids: state.screens.ids.concat(screenItem.id),
          lookup: Object.assign({}, state.screens.lookup, {
            [screenItem.id]: screenItem,
          }),
        },
      });

      return nextState;
    }

    case "POP_SCREEN_BY_COUNT": {
      let { count, stackId } = action;
      let stack = state.stacks.lookup[stackId ?? ""];

      if (!stack) {
        if (state.debugModeEnabled) {
          console.warn("Stack not found: ", stackId);
        }
        return state;
      }

      if (count === -1) {
        count = stack.screens.length;
      }

      let poppedScreenIds = stack.screens.splice(-count, count);

      let nextState = Object.assign(state, {});

      poppedScreenIds.forEach((screenId) => {
        delete nextState.screens.lookup[screenId];
        nextState.screens.ids = nextState.screens.ids.filter(
          (id) => id !== screenId
        );
      });

      return nextState;
    }

    case "POP_SCREEN_BY_KEY": {
      let { key } = action;

      let stackId = state.screens.lookup[key]?.stackId;
      let stack = state.stacks.lookup[stackId];

      if (!stack) {
        if (state.debugModeEnabled) {
          console.warn("Stack not found: ", stackId);
        }

        return state;
      }

      let nextState = Object.assign(state);

      nextState.stacks.lookup[stackId] = Object.assign(stack, {
        screens: stack.screens.filter((screenId) => screenId !== key),
      });

      delete nextState.screens.lookup[key];

      nextState.screens = {
        ids: nextState.screens.ids.filter((id) => id !== key),
        lookup: nextState.screens.lookup,
      };

      return nextState;
    }

    case "CREATE_TAB_INSTANCE": {
      let { tabId, initialActiveIndex } = action;

      let initialTabs: TabItem = {
        id: tabId || generateTabId(),
        activeIndex: initialActiveIndex,
        history: [],
      };

      let nextState = Object.assign(state);

      nextState.tabs.lookup[initialTabs.id] = initialTabs;
      nextState.tabs.ids = nextState.tabs.ids
        .filter((id) => id !== initialTabs.id)
        .concat(initialTabs.id);

      return nextState;
    }

    case "SET_TAB_INDEX": {
      let { tabId, index } = action;
      let { renderCharts } = context;

      let tab = state.tabs.lookup[tabId];

      if (!tab) {
        if (state.debugModeEnabled) {
          console.warn("Tab not found: ", tabId);
        }

        return state;
      }

      let nextState: NavigationState = Object.assign(state);

      if (tab.activeIndex === index) {
        let tabKey = serializeTabIndexKey(tabId, index);
        let stackIds = renderCharts.stacksByTabIndex[tabKey];

        if (stackIds?.length > 0) {
          stackIds.forEach((stackId) => {
            let stack = nextState.stacks.lookup[stackId];

            let count = stack?.screens.length;
            let poppedScreenIds = stack?.screens.splice(-count, count);
            poppedScreenIds.forEach((screenId) => {
              delete nextState.screens.lookup[screenId];
              nextState.screens.ids = nextState.screens.ids.filter(
                (id) => id !== screenId
              );
            });
          });
        }
      }

      tab.history = tab.history.filter((i) => i !== tab.activeIndex);
      tab.history.push(tab.activeIndex);
      tab.activeIndex = index;

      return nextState;
    }

    case "REGISTER_TAB": {
      let { depth, tabId, parentTabId, isActive } = action;
      let { renderCharts } = context;
      renderCharts.tabsByDepth[depth] = renderCharts.tabsByDepth[depth] || [];

      Object.keys(renderCharts.tabsByDepth).forEach((depth) => {
        renderCharts.tabsByDepth[depth] = renderCharts.tabsByDepth[
          depth
        ].filter((id) => id !== tabId);
      });

      renderCharts.tabParentsById[tabId] = parentTabId ?? "";

      if (isActive) {
        renderCharts.tabsByDepth[depth]?.push(tabId);
      }
      return state;
    }

    case "UNREGISTER_TAB": {
      let { tabId } = action;
      let { renderCharts } = context;
      for (let depth in renderCharts.tabsByDepth) {
        renderCharts.tabsByDepth[depth] = renderCharts.tabsByDepth[
          depth
        ].filter((id) => id !== tabId);
      }

      let nextState: NavigationState = Object.assign({}, state);

      nextState.tabs.ids = state.tabs.ids.filter((id) => id !== tabId);
      delete nextState.tabs.lookup[tabId];

      return nextState;
    }

    case "TAB_BACK": {
      let { tabId } = action;
      let nextState: NavigationState = Object.assign(state);

      let tab = nextState.tabs.lookup[tabId];
      let last = tab.history.pop();
      if (last != null) {
        tab.activeIndex = last;
      }

      return nextState;
    }

    default: {
      return state;
    }
  }
}
