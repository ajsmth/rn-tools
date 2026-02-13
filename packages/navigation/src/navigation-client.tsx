import * as React from "react";
import {
  createStore,
  useStore,
  createRenderTreeStore,
  getRenderNodeActive,
  getRenderNodeDepth,
} from "@rn-tools/core";
import type { Store, RenderTreeStore } from "@rn-tools/core";

export type PushOptions = {
  id?: string;
  stack?: string;
};

export type NavigationScreenEntry = {
  element: React.ReactElement;
  id?: string;
  options?: PushOptions;
};

export type TabState = {
  activeIndex: number;
};

export type NavigationState = {
  stacks: Map<string, NavigationScreenEntry[]>;
  tabs: Map<string, TabState>;
};

export type NavigationStore = Store<NavigationState>;

export const NavigationContext = React.createContext<NavigationClient | null>(null);

export const NavigationStoreContext = React.createContext<NavigationStore | null>(
  null,
);

export type NavigationStateInput = {
  stacks?:
    | Map<string, NavigationScreenEntry[]>
    | Record<string, NavigationScreenEntry[]>;
  tabs?:
    | Map<string, TabState>
    | Record<string, TabState>;
};

export function createNavigationState(
  input: NavigationStateInput = {},
): NavigationState {
  return normalizeNavigationState(input);
}

export function loadNavigationState(
  store: NavigationStore,
  input: NavigationState | NavigationStateInput,
) {
  store.setState(normalizeNavigationState(input));
}

export type NavigationClient = {
  store: NavigationStore;
  renderTreeStore: RenderTreeStore;
  push: (element: React.ReactElement, options?: PushOptions) => void;
  pop: (options?: { stack?: string }) => void;
  tab: (index: number, options?: { tabs?: string }) => void;
};

export function createNavigation(
  initialState?: NavigationStateInput,
): NavigationClient {
  const navStore = createStore(
    normalizeNavigationState(initialState ?? { stacks: new Map() }),
  );
  const renderTreeStore = createRenderTreeStore();

  function getDeepestActiveNodeId(type: string): string | null {
    const tree = renderTreeStore.getState();
    let deepestId: string | null = null;
    let deepestDepth = -1;

    for (const [id, node] of tree.nodes) {
      if (node.type !== type) continue;
      if (!getRenderNodeActive(tree, id)) continue;

      const depth = getRenderNodeDepth(tree, id);
      if (depth > deepestDepth) {
        deepestDepth = depth;
        deepestId = id;
      }
    }

    return deepestId;
  }

  function push(
    element: React.ReactElement,
    options?: PushOptions,
  ) {
    const stackId = options?.stack ?? getDeepestActiveNodeId("stack");
    if (!stackId) {
      throw new Error(
        "push: could not resolve stack. Pass { stack } explicitly or ensure a Stack is mounted and active.",
      );
    }

    navStore.setState((prev) => {
      const stacks = new Map(prev.stacks);
      const existing = stacks.get(stackId) ?? [];

      if (
        options?.id &&
        existing.some(
          (s) => s.id === options.id || s.options?.id === options.id,
        )
      ) {
        return prev;
      }

      stacks.set(stackId, [...existing, { element, id: options?.id, options }]);
      return { ...prev, stacks };
    });
  }

  function pop(options?: { stack?: string }) {
    const stackId = options?.stack ?? getDeepestActiveNodeId("stack");
    if (!stackId) {
      throw new Error(
        "pop: could not resolve stack. Pass { stack } explicitly or ensure a Stack is mounted and active.",
      );
    }

    navStore.setState((prev) => {
      const stacks = new Map(prev.stacks);
      const screens = stacks.get(stackId);
      if (!screens || screens.length === 0) return prev;
      stacks.set(stackId, screens.slice(0, -1));
      return { ...prev, stacks };
    });
  }

  function tab(index: number, options?: { tabs?: string }) {
    const tabsId = options?.tabs ?? getDeepestActiveNodeId("tabs");
    if (!tabsId) {
      throw new Error(
        "tab: could not resolve tabs. Pass { tabs } explicitly or ensure a Tabs is mounted and active.",
      );
    }

    navStore.setState((prev) => {
      const tabs = new Map(prev.tabs);
      tabs.set(tabsId, { activeIndex: index });
      return { ...prev, tabs };
    });
  }

  return { store: navStore, renderTreeStore, push, pop, tab };
}

export function useNavigation(): NavigationClient {
  const navigation = React.useContext(NavigationContext);
  if (!navigation) {
    throw new Error("NavigationProvider is missing from the component tree.");
  }
  return navigation;
}

export function useNavigationStore(): NavigationStore {
  const store = React.useContext(NavigationStoreContext);
  if (!store) {
    throw new Error("NavigationProvider is missing from the component tree.");
  }
  return store;
}

export function useTabActiveIndex(tabsId: string | null): number {
  const store = useNavigationStore();
  return useStore(store, (state) =>
    tabsId ? state.tabs.get(tabsId)?.activeIndex ?? 0 : 0,
  );
}

export function useStackScreens(
  stackKey: string | null,
): NavigationScreenEntry[] {
  const store = useNavigationStore();
  return useStore(store, (state) =>
    stackKey ? state.stacks.get(stackKey) ?? [] : [],
  );
}

function normalizeNavigationState(
  input: NavigationState | NavigationStateInput,
): NavigationState {
  const stacksInput =
    (input as NavigationState).stacks ??
    (input as NavigationStateInput).stacks ??
    new Map();

  const stacks =
    stacksInput instanceof Map
      ? new Map(stacksInput)
      : new Map(Object.entries(stacksInput));

  const tabsInput =
    (input as NavigationState).tabs ??
    (input as NavigationStateInput).tabs ??
    new Map();

  const tabs =
    tabsInput instanceof Map
      ? new Map(tabsInput)
      : new Map(Object.entries(tabsInput));

  return { stacks, tabs };
}
