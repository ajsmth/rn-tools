import * as React from "react";
import { Store, useStore, RenderTreeRoot } from "@rn-tools/core"

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

export function createNavigationStore(
  initialState: NavigationState | NavigationStateInput = { stacks: new Map() },
): NavigationStore {
  return new Store(normalizeNavigationState(initialState));
}

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

export type NavigationProviderProps = {
  store?: NavigationStore;
  children: React.ReactNode;
};

const rootStore = createNavigationStore();
export { rootStore as navigation };

export function NavigationProvider(props: NavigationProviderProps) {
  return (
    <RenderTreeRoot>
      <NavigationStoreContext.Provider value={props.store ?? rootStore}>
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

export function pushScreen(
  store: NavigationStore,
  element: React.ReactElement,
  options?: PushScreenOptions,
) {
  const stackKey = options?.stackId;
  if (!stackKey) {
    throw new Error("pushScreen requires options.stackId.");
  }

  store.setState((prev) => {
    const stacks = new Map(prev.stacks);
    const nextScreens = [
      ...(stacks.get(stackKey) ?? []),
      { element, key: options?.id, options },
    ];
    stacks.set(stackKey, nextScreens);
    return { stacks };
  });
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
