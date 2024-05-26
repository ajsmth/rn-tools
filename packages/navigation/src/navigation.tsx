import * as React from "react";
import {
  BackHandler,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import {
  ScreenStack as RNScreenStack,
  ScreenStackProps as RNScreenStackProps,
  Screen as RNScreen,
  ScreenProps as RNScreenProps,
  ScreenStackHeaderConfig as RNScreenStackHeaderConfig,
  ScreenStackHeaderConfigProps as RNScreenStackHeaderConfigProps,
  ScreenContainer as RNScreenContainer,
  ScreenContainerProps as RNScreenContainerProps,
} from "react-native-screens";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

/**
 * Ideas:
 *  - reset navigation
 *    - tabs / stack ref should read from store, not local state ref -> should recreate after being destroyed?
 *  - remove immer?
 *  - provide initial state?
 *  - monitor rerenders
 *  - warn on parallel stacks?
 *  - lifecycles?
 *  - testing - internal and jest plugin
 */

let generateStackId = createIdGenerator("stack");
let generateScreenId = createIdGenerator("screen");
let generateTabId = createIdGenerator("tab");

function createIdGenerator(name: string) {
  let counter = 0;

  return function generateId() {
    return name + "-" + counter++;
  };
}

type PushScreenOptions = {
  stackId?: string;
  slotName?: string;
  key?: string;
};

type NavigationStore = {
  stacks: {
    lookup: Record<string, StackItem>;
    ids: string[];
  };
  tabs: {
    lookup: Record<string, TabItem>;
    ids: string[];
  };
  screens: {
    lookup: Record<string, ScreenItem>;
    ids: string[];
  };
  debugModeEnabled: boolean;
};

let storeBase = create<NavigationStore>();
let useNavigation = storeBase(
  immer(() => {
    return {
      stacks: {
        lookup: {},
        ids: [],
      },
      tabs: {
        lookup: {},
        ids: [],
      },
      screens: {
        lookup: {},
        ids: [],
      },
      debugModeEnabled: false,
    };
  })
);

let navigationStore = useNavigation;
let setState = navigationStore.setState;
let getState = navigationStore.getState;

export function setDebugModeEnabled(enabled: boolean) {
  setState((state) => {
    state.debugModeEnabled = enabled;
  });
}

type RenderCharts = {
  stacksByDepth: Record<string, string[]>;
  tabsByDepth: Record<string, string[]>;
  tabParentsById: Record<string, string>;
  stackParentsById: Record<string, string>;
  stacksByTabIndex: Record<string, string[]>;
};

let renderCharts: RenderCharts = {
  stacksByDepth: {},
  tabsByDepth: {},
  tabParentsById: {},
  stackParentsById: {},
  stacksByTabIndex: {},
};

type StackItem = {
  id: string;
  defaultSlotName?: string;
  screens: string[];
};

type ScreenItem = {
  id: string;
  element: React.ReactElement<unknown>;
  slotName?: string;
};

type TabItem = {
  id: string;
  activeIndex: number;
  history: number[];
};

export type StackInstance = ReturnType<typeof getStackFns>;

let DEFAULT_SLOT_NAME = "DEFAULT_SLOT";

function addStack(stack: StackItem) {
  setState((state) => {
    state.stacks.ids = state.stacks.ids
      .filter((id) => id !== stack.id)
      .concat(stack.id);

    state.stacks.lookup[stack.id] = stack;
  });
}

function addTabs(tabs: TabItem) {
  setState((state) => {
    state.tabs.ids = state.tabs.ids
      .filter((id) => id !== tabs.id)
      .concat(tabs.id);

    state.tabs.lookup[tabs.id] = tabs;
  });
}

function createStack({
  defaultSlotName = DEFAULT_SLOT_NAME,
  id,
}: {
  defaultSlotName?: string;
  id?: string;
} = {}) {
  let stackId = id || generateStackId();

  let initialStack: StackItem = {
    id: stackId,
    defaultSlotName,
    screens: [],
  };

  addStack(initialStack);

  return getStackFns(stackId);
}

function getStack(stackId = "") {
  let stackItem = getState().stacks.lookup[stackId];

  if (!stackItem) {
    return null;
  }

  return getStackFns(stackItem.id);
}

function getStackFns(stackId: string) {
  return {
    id: stackId,
    push: (screen: React.ReactElement<unknown>, options?: PushScreenOptions) =>
      pushScreen(screen, { stackId, ...options }),
    pop: (count: number) => popScreen(count, { stackId }),
    popByKey: (key: string) => popScreenByKey(key, { stackId }),
    get: () => getState().stacks.lookup[stackId],
    getParent: () => {
      let parentId = renderCharts.stackParentsById[stackId];
      return getStackFns(parentId);
    },
    canGoBack: () => {
      let stack = getState().stacks.lookup[stackId];
      return stack?.screens.length > 0;
    },
    reset: () => popScreen(-1, { stackId }),
  };
}

function pushScreen(
  element: React.ReactElement<unknown>,
  options: PushScreenOptions
) {
  setState((state) => {
    let stack = state.stacks.lookup[options.stackId ?? ""];

    if (!stack) {
      if (state.debugModeEnabled) {
        console.warn("Stack not found: ", options.stackId);
      }
      return;
    }

    if (state.screens.lookup[options.key ?? ""]) {
      return;
    }

    let screenItem: ScreenItem = {
      element,
      slotName: options.slotName || stack.defaultSlotName,
      id: options.key || generateScreenId(),
    };

    stack.screens.push(screenItem.id);
    state.screens.ids.push(screenItem.id);
    state.screens.lookup[screenItem.id] = screenItem;
  });
}

function popScreen(count = 1, options: { stackId: string }) {
  setState((state) => {
    let stack = state.stacks.lookup[options.stackId ?? ""];

    if (!stack) {
      if (state.debugModeEnabled) {
        console.warn("Stack not found: ", options.stackId);
      }
      return;
    }

    if (count === -1) {
      count = stack.screens.length;
    }
    let poppedScreenIds = stack.screens.splice(-count, count);

    poppedScreenIds.forEach((screenId) => {
      delete state.screens.lookup[screenId];
      state.screens.ids = state.screens.ids.filter((id) => id !== screenId);
    });
  });
}

function popScreenByKey(key: string, options: { stackId: string }) {
  setState((state) => {
    let stack = state.stacks.lookup[options.stackId ?? ""];

    if (!stack) {
      if (state.debugModeEnabled) {
        console.warn("Stack not found: ", options.stackId);
      }
      return;
    }

    stack.screens = stack.screens.filter((screenId) => screenId !== key);

    delete state.screens.lookup[key];
    state.screens.ids = state.screens.ids.filter((id) => id !== key);
  });
}

function registerStack({
  depth,
  isActive,
  stackId,
  parentStackId,
  parentTabId,
  tabIndex,
}: {
  depth: number;
  isActive: boolean;
  stackId: string;
  parentStackId: string;
  parentTabId: string;
  tabIndex: number;
}) {
  renderCharts.stacksByDepth[depth] = renderCharts.stacksByDepth[depth] || [];

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
    let tabIndexKey = sertializeTabIndexKey(parentTabId, tabIndex);
    renderCharts.stacksByTabIndex[tabIndexKey] =
      renderCharts.stacksByTabIndex[tabIndexKey] || [];

    if (!renderCharts.stacksByTabIndex[tabIndexKey].includes(stackId)) {
      renderCharts.stacksByTabIndex[tabIndexKey].push(stackId);
    }
  }
}

let sertializeTabIndexKey = (tabId: string, index: number) =>
  `${tabId}-${index}`;

function unregisterStack({ stackId }: { stackId: string }) {
  for (let depth in renderCharts.stacksByDepth) {
    renderCharts.stacksByDepth[depth] = renderCharts.stacksByDepth[
      depth
    ].filter((id) => id !== stackId);
  }

  setState((state) => {
    let stack = state.stacks.lookup[stackId];

    if (renderCharts.stackParentsById[stackId] != null) {
      state.stacks.ids = state.stacks.ids.filter((id) => id !== stackId);
      delete state.stacks.lookup[stackId];

      stack?.screens.forEach((screenId) => {
        delete state.screens.lookup[screenId];
        state.screens.ids = state.screens.ids.filter((id) => id !== screenId);
      });
    }
  });
}

function getFocusedStack() {
  let maxDepth = Math.max(
    ...Object.keys(renderCharts.stacksByDepth)
      .filter((key) => renderCharts.stacksByDepth[key].length > 0)
      .map(Number)
  );
  let stackIds = renderCharts.stacksByDepth[maxDepth];
  let topStackId = stackIds[stackIds.length - 1];
  return getStackFns(topStackId);
}

const noop = () => null;

let stackInstanceStub: StackInstance = {
  id: "STUB",
  push: noop,
  pop: noop,
  get: () => {
    return {
      id: "STUB",
      screens: [],
    };
  },
  getParent: () => stackInstanceStub,
  canGoBack: () => false,
  popByKey: noop,
  reset: noop,
};

let StackContext = React.createContext<StackInstance>(stackInstanceStub);
let StackIdContext = React.createContext<string>("");
let ScreenIdContext = React.createContext<string>("");

let ActiveContext = React.createContext<boolean>(true);
let DepthContext = React.createContext<number>(0);

type StackRootProps = {
  children: React.ReactNode;
  id?: string;
};

function StackRoot({ children, id }: StackRootProps) {
  let [stackRef, setStackRef] = React.useState<StackInstance | null>(
    getStack(id)
  );

  let stack = React.useMemo(() => getStack(stackRef?.id), [stackRef]);
  console.log("StackRoot", { id, stackRef, stack });

  React.useEffect(() => {
    if (!stack) {
      console.log(`creatingNewStack`, { id });
      setStackRef(createStack({ id }));
    }
  }, [id, stack]);

  let isActive = React.useContext(ActiveContext);
  let parentDepth = React.useContext(DepthContext);
  let parentStackId = React.useContext(StackIdContext);

  let depth = parentDepth + 1;
  let stackId = stackRef?.id;
  let parentTabId = React.useContext(TabIdContext);
  let tabIndex = React.useContext(TabScreenIndexContext);

  React.useEffect(() => {
    if (stackId != null) {
      registerStack({
        depth,
        isActive,
        stackId,
        parentStackId,
        parentTabId,
        tabIndex,
      });
    }
  }, [stackId, depth, isActive, parentStackId, parentTabId, tabIndex]);

  React.useEffect(() => {
    return () => {
      if (stackId != null) {
        unregisterStack({ stackId });
      }
    };
  }, [stackId]);

  if (!stackRef) {
    return null;
  }

  return (
    <StackContext.Provider value={stackRef}>
      <StackIdContext.Provider value={stackRef.id}>
        <DepthContext.Provider value={depth}>
          <ActiveContext.Provider value={isActive}>
            {children}
          </ActiveContext.Provider>
        </DepthContext.Provider>
      </StackIdContext.Provider>
    </StackContext.Provider>
  );
}

function StackScreens({
  children,
  style: styleProp,
  ...props
}: { children: React.ReactNode } & RNScreenStackProps) {
  let style = React.useMemo(
    () => styleProp || StyleSheet.absoluteFill,
    [styleProp]
  );

  return (
    <RNScreenStack {...props} style={style}>
      {children}
    </RNScreenStack>
  );
}

function StackScreen({
  children,
  style: styleProp,
  gestureEnabled = true,
  onDismissed: onDismissedProp,
  ...props
}: { children: React.ReactNode } & RNScreenProps) {
  let screenId = React.useContext(ScreenIdContext);
  let stack = React.useContext(StackContext);

  let isActive = React.useContext(ActiveContext);

  let onDismissed: RNScreenProps["onDismissed"] = React.useCallback(
    (e) => {
      stack.popByKey(screenId);
      onDismissedProp?.(e);
    },
    [stack, screenId, onDismissedProp]
  );

  React.useEffect(() => {
    function backHandler() {
      if (gestureEnabled && isActive && stack.canGoBack()) {
        stack.popByKey(screenId);
        return true;
      }

      return false;
    }

    BackHandler.addEventListener("hardwareBackPress", backHandler);

    return () => {
      BackHandler.removeEventListener("hardwareBackPress", backHandler);
    };
  }, [gestureEnabled, stack, screenId, isActive]);

  let style = React.useMemo(
    () => styleProp || StyleSheet.absoluteFill,
    [styleProp]
  );

  return (
    // @ts-expect-error - cleanup typings
    <RNScreen
      {...props}
      style={style}
      activityState={isActive ? 2 : 0}
      gestureEnabled={gestureEnabled}
      onDismissed={onDismissed}
    >
      {children}
    </RNScreen>
  );
}

let useStackScreens = (stackId = "", slotName: string) => {
  return useNavigation((state) => {
    let stack = state.stacks.lookup[stackId];
    return (
      stack?.screens
        .map((screenId) => state.screens.lookup[screenId])
        .filter((s) => s && s.slotName === slotName) ?? []
    );
  });
};

function StackSlot({ slotName = DEFAULT_SLOT_NAME }: { slotName?: string }) {
  let stackId = React.useContext(StackIdContext);
  let screens = useStackScreens(stackId, slotName);

  return (
    <>
      {screens.map((screen) => {
        return (
          <ScreenIdContext.Provider value={screen.id} key={screen.id}>
            {screen.element}
          </ScreenIdContext.Provider>
        );
      })}
    </>
  );
}

function StackScreenHeader({
  ...props
}: { children: React.ReactNode } & RNScreenStackHeaderConfigProps) {
  return <RNScreenStackHeaderConfig {...props} />;
}

export let Stack = {
  Root: StackRoot,
  Screens: StackScreens,
  Screen: StackScreen,
  Header: StackScreenHeader,
  Slot: StackSlot,
};

export let useStack = () => React.useContext(StackContext);

navigationStore.subscribe((state) => {
  if (state.debugModeEnabled) {
    console.debug("@rntoolkit/navigation state updated: ", state);
  }
});

export let navigation = {
  pushScreen: (
    element: React.ReactElement<unknown>,
    options?: PushScreenOptions
  ) => {
    let focusedStack = getFocusedStack();
    return pushScreen(element, {
      ...options,
      stackId: options?.stackId || focusedStack.id,
    });
  },
  popScreen: (count = 1) => {
    let stack = getFocusedStack();
    let stackId = stack.id;
    let numScreens = stack.get()?.screens.length || 0;

    let screensToPop = Math.max(Math.min(numScreens, count), 0);

    popScreen(screensToPop, { stackId });
    let remainingScreens = count - screensToPop;

    let parentStackId = renderCharts.stackParentsById[stackId];
    let parentStack = getState().stacks.lookup[parentStackId];

    while (remainingScreens > 0 && parentStackId && parentStack) {
      let screensToPop = Math.min(parentStack.screens.length, remainingScreens);
      popScreen(screensToPop, { stackId: parentStackId });
      remainingScreens = remainingScreens - screensToPop;

      let nextParentStack = renderCharts.stackParentsById[parentStack.id];

      parentStackId = nextParentStack;
      parentStack = getState().stacks.lookup[parentStackId];
    }
  },

  setTabIndex: (index: number, options?: { tabId?: string }) => {
    let focusedTabs = getFocusedTabs();
    setTabIndex(index, { ...options, tabId: options?.tabId || focusedTabs.id });
  },

  reset: () => {
    setState((state) => {
      state.stacks = {
        lookup: {},
        ids: [],
      };

      state.tabs = {
        lookup: {},
        ids: [],
      };

      state.screens = {
        lookup: {},
        ids: [],
      };
    });

    renderCharts = {
      stacksByDepth: {},
      tabsByDepth: {},
      tabParentsById: {},
      stackParentsById: {},
      stacksByTabIndex: {},
    };
  },

  getStack: (stackId: string) => {
    return getStack(stackId);
  },

  getTabs: (tabId: string) => {
    return getTabs(tabId);
  },
};

export type TabsInstance = ReturnType<typeof getTabFns>;

function createTabs({
  id,
  initialActiveIndex = 0,
}: {
  id?: string;
  initialActiveIndex?: 0;
}) {
  let tabId = id || generateTabId();

  let initialTabs: TabItem = {
    id: tabId,
    activeIndex: initialActiveIndex,
    history: [],
  };

  addTabs(initialTabs);

  return getTabFns(tabId);
}

function setActiveIndex(index: number, { tabId }: { tabId: string }) {
  setState((state) => {
    let tab = state.tabs.lookup[tabId];

    if (tab) {
      if (tab.activeIndex === index) {
        let tabKey = sertializeTabIndexKey(tabId, index);
        let stackIds = renderCharts.stacksByTabIndex[tabKey];

        if (stackIds?.length > 0) {
          stackIds.forEach((stackId) => {
            let stack = state.stacks.lookup[stackId];

            let count = stack?.screens.length;
            let poppedScreenIds = stack?.screens.splice(-count, count);
            poppedScreenIds.forEach((screenId) => {
              delete state.screens.lookup[screenId];
              state.screens.ids = state.screens.ids.filter(
                (id) => id !== screenId
              );
            });
          });
        }
      }

      tab.history = tab.history.filter((i) => i !== tab.activeIndex);
      tab.history.push(tab.activeIndex);
      tab.activeIndex = index;
    }
  });
}

function goBack({ tabId = "" }: { tabId?: string }) {
  setState((state) => {
    let tab = state.tabs.lookup[tabId];

    if (tab) {
      let last = tab.history.pop();
      if (last != null) {
        tab.activeIndex = last;
      }
    }
  });
}

function getTabFns(tabId: string) {
  return {
    id: tabId,
    get: () => getState().tabs.lookup[tabId],
    setActiveIndex: (index: number) => setActiveIndex(index, { tabId }),
    reset: () => setActiveIndex(0, { tabId }),
  };
}

let TABS_STUB: TabsInstance = {
  id: "STUB",
  get: () => {
    return {
      id: "STUB",
      activeIndex: 0,
      history: [],
    };
  },
  setActiveIndex: noop,
  reset: noop,
};

let TabsContext = React.createContext<TabsInstance>(TABS_STUB);
let TabIdContext = React.createContext<string>("");

type TabsRootProps = {
  children: React.ReactNode;
  id?: string;
};

function TabsRoot({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  let [tabsRef, setTabsRef] = React.useState<TabsInstance | null>(getTabs(id));

  let tabId = tabsRef?.id;
  let depth = React.useContext(DepthContext);
  let isActive = React.useContext(ActiveContext);
  let parentTabId = React.useContext(TabIdContext);

  let tabs = React.useMemo(() => getTabs(tabsRef?.id), [tabsRef]);

  React.useEffect(() => {
    if (!tabs) {
      setTabsRef(createTabs({ id }));
    }
  }, [tabs, id]);

  React.useEffect(() => {
    if (tabId != null) {
      registerTabs({
        depth,
        isActive,
        tabId,
        parentTabId,
      });
    }
  }, [tabId, depth, isActive, parentTabId]);

  React.useEffect(() => {
    return () => {
      if (tabId != null) {
        unregisterTabs({ tabId });
      }
    };
  }, [tabId]);

  if (!tabsRef) {
    return null;
  }

  return (
    <TabsContext.Provider value={tabsRef}>
      <TabIdContext.Provider value={tabsRef.id}>
        {children}
      </TabIdContext.Provider>
    </TabsContext.Provider>
  );
}

let TabScreenIndexContext = React.createContext<number>(0);

let defaultScreenContainerStyle = {
  flex: 1,
};

function TabsScreens({
  children,
  ...props
}: { children: React.ReactNode } & RNScreenContainerProps) {
  return (
    <RNScreenContainer style={defaultScreenContainerStyle} {...props}>
      {React.Children.map(children, (child, index) => {
        return (
          <TabScreenIndexContext.Provider value={index}>
            {child}
          </TabScreenIndexContext.Provider>
        );
      })}
    </RNScreenContainer>
  );
}

let useTabItem = (tabId = "") =>
  useNavigation((state) => state.tabs.lookup[tabId]);

function TabsScreen({
  children,
  style: styleProp,
  ...props
}: { children: React.ReactNode } & RNScreenProps) {
  let tabId = React.useContext(TabIdContext);
  let tabs = useTabItem(tabId);
  let index = React.useContext(TabScreenIndexContext);

  let parentIsActive = React.useContext(ActiveContext);
  let activeIndex = tabs?.activeIndex;
  let isActive = index === activeIndex;

  React.useEffect(() => {
    function backHandler() {
      let tabs = getTabs(tabId)?.get();

      if (tabs && tabs.history.length > 0) {
        goBack({ tabId });
        return true;
      }

      return false;
    }

    BackHandler.addEventListener("hardwareBackPress", backHandler);

    return () => {
      BackHandler.removeEventListener("hardwareBackPress", backHandler);
    };
  }, [tabId]);

  let style = React.useMemo(
    () => styleProp || StyleSheet.absoluteFill,
    [styleProp]
  );

  return (
    // @ts-expect-error - cleanup typings
    <RNScreen
      active={isActive ? 1 : 0}
      activityState={isActive ? 2 : 0}
      style={style}
      {...props}
    >
      <ActiveContext.Provider value={parentIsActive && isActive}>
        {children}
      </ActiveContext.Provider>
    </RNScreen>
  );
}

export let defaultTabbarStyle: ViewStyle = {
  flexDirection: "row",
  backgroundColor: "white",
};

function TabsTabbar({
  children,
  style: styleProp,
  ...props
}: { children: React.ReactNode } & ViewProps) {
  let style = React.useMemo(() => styleProp || defaultTabbarStyle, [styleProp]);

  return (
    <View style={style} {...props}>
      {React.Children.map(children, (child, index) => {
        return (
          <TabScreenIndexContext.Provider value={index}>
            {child}
          </TabScreenIndexContext.Provider>
        );
      })}
    </View>
  );
}

type TabbarTabProps = {
  activeStyle?: PressableProps["style"];
  inactiveStyle?: PressableProps["style"];
  style?: PressableProps["style"];
  children:
    | React.ReactNode
    | ((props: { isActive: boolean; onPress: () => void }) => React.ReactNode);
} & Omit<PressableProps, "children">;

let defaultTabStyle: ViewStyle = {
  flex: 1,
};

function TabsTab({ children, ...props }: TabbarTabProps) {
  let tabId = React.useContext(TabIdContext);
  let index = React.useContext(TabScreenIndexContext);
  let tabs = useTabItem(tabId);

  let activeIndex = tabs?.activeIndex;
  let isActive = index === activeIndex;

  let onPress: () => void = React.useCallback(() => {
    setActiveIndex(index, { tabId });
  }, [tabId, index]);

  let style = React.useMemo(() => {
    let baseStyle = props.style || defaultTabStyle;
    let activeStyle = isActive ? props.activeStyle : props.inactiveStyle;
    return [baseStyle, activeStyle];
  }, [isActive, props.activeStyle, props.inactiveStyle, props.style]);

  let renderChildren = React.useMemo(() => {
    if (typeof children === "function") {
      return children({ isActive, onPress });
    }

    return children;
  }, [isActive, onPress, children]);

  return (
    // @ts-expect-error - cleanup typings
    <Pressable onPress={onPress} style={style} {...props}>
      {renderChildren}
    </Pressable>
  );
}

export let Tabs = {
  Root: TabsRoot,
  Screens: TabsScreens,
  Screen: TabsScreen,
  Tabbar: TabsTabbar,
  Tab: TabsTab,
};

function setTabIndex(index: number, options: { tabId: string }) {
  setState((state) => {
    let tab = state.tabs.lookup[options.tabId];
    if (tab) {
      tab.activeIndex = index;
    }
  });
}

function registerTabs({
  depth,
  tabId,
  isActive,
  parentTabId,
}: {
  depth: number;
  tabId: string;
  isActive: boolean;
  parentTabId?: string;
}) {
  renderCharts.tabsByDepth[depth] = renderCharts.tabsByDepth[depth] || [];

  Object.keys(renderCharts.tabsByDepth).forEach((depth) => {
    renderCharts.tabsByDepth[depth] = renderCharts.tabsByDepth[depth].filter(
      (id) => id !== tabId
    );
  });

  renderCharts.tabParentsById[tabId] = parentTabId ?? "";

  if (isActive) {
    renderCharts.tabsByDepth[depth]?.push(tabId);
  }
}

function unregisterTabs({ tabId }: { tabId: string }) {
  for (let depth in renderCharts.tabsByDepth) {
    renderCharts.tabsByDepth[depth] = renderCharts.tabsByDepth[depth].filter(
      (id) => id !== tabId
    );
  }

  setState((state) => {
    state.tabs.ids = state.tabs.ids.filter((id) => id !== tabId);
    delete state.tabs.lookup[tabId];
  });
}

function getFocusedTabs() {
  let maxDepth = Math.max(
    ...Object.keys(renderCharts.tabsByDepth)
      .filter((key) => renderCharts.tabsByDepth[key].length > 0)
      .map(Number)
  );
  let tabIds = renderCharts.tabsByDepth[maxDepth];
  let topTabId = tabIds[tabIds.length - 1];
  return getTabFns(topTabId);
}

type StackNavigatorProps = Omit<StackRootProps, "children"> & {
  rootScreen: React.ReactElement<unknown>;
};

export function StackNavigator({
  rootScreen,
  ...rootProps
}: StackNavigatorProps) {
  return (
    <Stack.Root {...rootProps}>
      <Stack.Screens>
        <Stack.Screen>{rootScreen}</Stack.Screen>
        <Stack.Slot />
      </Stack.Screens>
    </Stack.Root>
  );
}

type TabNavigatorProps = Omit<TabsRootProps, "children"> & {
  screens: TabNavigatorScreenOptions[];
  tabbarPosition?: "top" | "bottom";
  tabbarStyle?: ViewProps["style"];
  screenContainerStyle?: RNScreenContainerProps["style"];
};

type TabNavigatorScreenOptions = {
  key: string;
  screen: React.ReactElement<unknown>;
  tab: (props: { isActive: boolean; onPress: () => void }) => React.ReactNode;
};

export function TabNavigator({
  screens,
  tabbarPosition = "bottom",
  tabbarStyle,
  screenContainerStyle,
  ...rootProps
}: TabNavigatorProps) {
  return (
    <Tabs.Root {...rootProps}>
      {tabbarPosition === "top" && (
        <Tabs.Tabbar style={tabbarStyle}>
          {screens.map((screen) => {
            return <Tabs.Tab key={screen.key}>{screen.tab}</Tabs.Tab>;
          })}
        </Tabs.Tabbar>
      )}

      <Tabs.Screens style={screenContainerStyle}>
        {screens.map((screen) => {
          return <Tabs.Screen key={screen.key}>{screen.screen}</Tabs.Screen>;
        })}
      </Tabs.Screens>

      {tabbarPosition === "bottom" && (
        <Tabs.Tabbar style={tabbarStyle}>
          {screens.map((screen) => {
            return <Tabs.Tab key={screen.key}>{screen.tab}</Tabs.Tab>;
          })}
        </Tabs.Tabbar>
      )}
    </Tabs.Root>
  );
}

function getTabs(tabId = "") {
  let tabItem = getState().tabs.lookup[tabId];

  if (!tabItem) {
    return null;
  }

  return getTabFns(tabItem.id);
}
