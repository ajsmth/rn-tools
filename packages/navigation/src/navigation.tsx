import * as React from "react";
import {
  createStore,
  useStore,
  RenderTreeRoot,
  createRenderTreeStore,
  getRenderNodeActive,
  getRenderNodeDepth,
} from "@rn-tools/core";
import type { Store, RenderTreeStore } from "@rn-tools/core";

export type PushScreenOptions = {
  id?: string;
  stackId?: string;
};

export type NavigationScreenEntry = {
  element: React.ReactElement;
  id?: string;
  options?: PushScreenOptions;
};

export type NavigationState = {
  stacks: Map<string, NavigationScreenEntry[]>;
};

export type NavigationStore = Store<NavigationState>;

const NavigationStoreContext = React.createContext<NavigationStore | null>(
  null,
);

export type NavigationStateInput = {
  stacks?:
    | Map<string, NavigationScreenEntry[]>
    | Record<string, NavigationScreenEntry[]>;
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

export type Navigation = {
  store: NavigationStore;
  renderTreeStore: RenderTreeStore;
  pushScreen: (element: React.ReactElement, options?: PushScreenOptions) => void;
  popScreen: (options?: { stackId?: string }) => void;
};

export function createNavigation(
  initialState?: NavigationStateInput,
): Navigation {
  const navStore = createStore(
    normalizeNavigationState(initialState ?? { stacks: new Map() }),
  );
  const renderTreeStore = createRenderTreeStore();

  function getActiveStackId(): string | null {
    const tree = renderTreeStore.getState();
    let deepestId: string | null = null;
    let deepestDepth = -1;

    for (const [id, node] of tree.nodes) {
      if (node.type !== "stack") continue;
      if (!getRenderNodeActive(tree, id)) continue;

      const depth = getRenderNodeDepth(tree, id);
      if (depth > deepestDepth) {
        deepestDepth = depth;
        deepestId = id;
      }
    }

    return deepestId;
  }

  function pushScreen(
    element: React.ReactElement,
    options?: PushScreenOptions,
  ) {
    const stackId = options?.stackId ?? getActiveStackId();
    if (!stackId) {
      throw new Error(
        "pushScreen: could not resolve stackId. Pass { stackId } explicitly or ensure a Stack is mounted and active.",
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
      return { stacks };
    });
  }

  function popScreen(options?: { stackId?: string }) {
    const stackId = options?.stackId ?? getActiveStackId();
    if (!stackId) {
      throw new Error(
        "popScreen: could not resolve stackId. Pass { stackId } explicitly or ensure a Stack is mounted and active.",
      );
    }

    navStore.setState((prev) => {
      const stacks = new Map(prev.stacks);
      const screens = stacks.get(stackId);
      if (!screens || screens.length === 0) return prev;
      stacks.set(stackId, screens.slice(0, -1));
      return { stacks };
    });
  }

  return { store: navStore, renderTreeStore, pushScreen, popScreen };
}

export type NavigationProviderProps = {
  navigation: Navigation;
  children: React.ReactNode;
};

export function NavigationProvider(props: NavigationProviderProps) {
  return (
    <RenderTreeRoot store={props.navigation.renderTreeStore}>
      <NavigationStoreContext.Provider value={props.navigation.store}>
        {props.children}
      </NavigationStoreContext.Provider>
    </RenderTreeRoot>
  );
}

export function useNavigationStore(): NavigationStore {
  const store = React.useContext(NavigationStoreContext);
  if (!store) {
    throw new Error("NavigationProvider is missing from the component tree.");
  }
  return store;
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

  return { stacks };
}
