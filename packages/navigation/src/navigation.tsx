import * as React from "react";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

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
import {
  BackHandler,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewProps,
  type ViewStyle,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Ideas:
 *  - make screens navigationwide
 *  - reset navigation
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

  debugModeEnabled: boolean;
};

let storeBase = create<NavigationStore>();
let useNavigation = storeBase(
  immer((set) => {
    return {
      stacks: {
        lookup: {},
        ids: [],
      },
      tabs: {
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

type DepthCharts = {
  stacksByDepth: Record<string, string[]>;
  tabsByDepth: Record<string, string[]>;
  tabParentsById: Record<string, string>;
  stackParentsById: Record<string, string>;
};

let depthCharts: DepthCharts = {
  stacksByDepth: {},
  tabsByDepth: {},
  tabParentsById: {},
  stackParentsById: {},
};

type StackItem = {
  id: string;
  defaultSlotName?: string;
  screens: ScreenItem[];
  isGenerated?: boolean;
};

type ScreenItem = {
  id: string;
  element: React.ReactElement<unknown>;
  slotName?: string;
};

type TabItem = {
  id: string;
  activeIndex: number;
  isGenerated?: boolean;
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
    isGenerated: !id,
  };

  addStack(initialStack);

  return getStackFns(stackId);
}

function getStack(stackId: string = "") {
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

    if (stack.screens.find((screen) => screen.id === options.key)) {
      return;
    }

    let screenItem: ScreenItem = {
      element,
      slotName: options.slotName || stack.defaultSlotName,
      id: options.key || generateScreenId(),
    };

    stack.screens.push(screenItem);
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
      stack.screens = [];
      return;
    }

    stack.screens = stack.screens.slice(0, -count);
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

    stack.screens = stack.screens.filter((screen) => screen.id !== key);
  });
}

function registerStack({
  depth,
  isActive,
  stackId,
  parentStackId,
}: {
  depth: number;
  isActive: boolean;
  stackId: string;
  parentStackId: string;
}) {
  depthCharts.stacksByDepth[depth] = depthCharts.stacksByDepth[depth] || [];

  Object.keys(depthCharts.stacksByDepth).forEach((depth) => {
    depthCharts.stacksByDepth[depth] = depthCharts.stacksByDepth[depth].filter(
      (id) => id !== stackId
    );
  });

  if (isActive && !depthCharts.stacksByDepth[depth].includes(stackId)) {
    depthCharts.stacksByDepth[depth].push(stackId);
  }

  if (parentStackId) {
    depthCharts.stackParentsById[stackId] = parentStackId;
  }
}

function unregisterStack({ stackId }: { stackId: string }) {
  for (let depth in depthCharts.stacksByDepth) {
    depthCharts.stacksByDepth[depth] = depthCharts.stacksByDepth[depth].filter(
      (id) => id !== stackId
    );
  }

  setState((state) => {
    let stack = state.stacks.lookup[stackId];

    if (stack?.isGenerated && depthCharts.stackParentsById[stackId] != null) {
      state.stacks.ids = state.stacks.ids.filter((id) => id !== stackId);
      delete state.stacks.lookup[stackId];
    }
  });
}

function getFocusedStack() {
  let maxDepth = Math.max(
    ...Object.keys(depthCharts.stacksByDepth)
      .filter((key) => depthCharts.stacksByDepth[key].length > 0)
      .map(Number)
  );
  let stackIds = depthCharts.stacksByDepth[maxDepth];
  let topStackId = stackIds[stackIds.length - 1];
  return getStackFns(topStackId);
}

let stackInstanceStub: StackInstance = {
  id: "STUB",
  push: () => {},
  pop: () => {},
  get: () => {
    return {
      id: "STUB",
      screens: [],
    };
  },
  popByKey: () => {},
  reset: () => {},
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

  let stack = React.useMemo(() => getStack(id), [id]);

  React.useEffect(() => {
    if (!stack) {
      stack = createStack({ id });
      setStackRef(stack);
    }
  }, [id]);

  let isActive = React.useContext(ActiveContext);
  let parentDepth = React.useContext(DepthContext);
  let parentStackId = React.useContext(StackIdContext);

  let depth = parentDepth + 1;
  let stackId = stackRef?.id;

  React.useEffect(() => {
    if (stackId != null) {
      registerStack({
        depth,
        isActive,
        stackId,
        parentStackId,
      });
    }
  }, [stackId, depth, isActive, parentStackId]);

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
  ...props
}: { children: React.ReactNode } & RNScreenProps) {
  let screenId = React.useContext(ScreenIdContext);
  let stack = React.useContext(StackContext);

  let onDismissed: RNScreenProps["onDismissed"] = React.useCallback(
    (e) => {
      stack.popByKey(screenId);
      props.onDismissed?.(e);
    },
    [stack, screenId, props.onDismissed]
  );

  React.useEffect(() => {
    function backHandler() {
      if (props.gestureEnabled) {
        stack.popByKey(screenId);
        return true;
      }

      return false;
    }

    BackHandler.addEventListener("hardwareBackPress", backHandler);

    return () => {
      BackHandler.removeEventListener("hardwareBackPress", backHandler);
    };
  }, [props.gestureEnabled, stack, screenId]);

  let style = React.useMemo(
    () => styleProp || StyleSheet.absoluteFill,
    [styleProp]
  );

  return (
    <RNScreen {...props} style={style} onDismissed={onDismissed}>
      {children}
    </RNScreen>
  );
}

let useStackItem = (stackId = "") =>
  useNavigation((state) => state.stacks.lookup[stackId]);

function StackSlot({ slotName = DEFAULT_SLOT_NAME }: { slotName?: string }) {
  let stackId = React.useContext(StackIdContext);
  let stack = useStackItem(stackId);

  let screens = stack?.screens.filter((screen) => screen.slotName === slotName);

  return (
    <>
      {screens?.map((screen) => {
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
  children,
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
    console.log("State updated", state);
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
  popScreen: (count: number = 1) => {
    let stack = getFocusedStack();
    let stackId = stack.id;
    let numScreens = stack.get()?.screens.length || 0;

    let screensToPop = Math.min(numScreens, count);

    popScreen(screensToPop, { stackId });
    let remainingScreens = count - screensToPop;

    let parentStackId = depthCharts.stackParentsById[stackId];
    let parentStack = getState().stacks.lookup[parentStackId];

    while (remainingScreens > 0 && parentStackId && parentStack) {
      let screensToPop = Math.min(parentStack.screens.length, remainingScreens);
      popScreen(screensToPop, { stackId: parentStackId });
      remainingScreens = remainingScreens - screensToPop;

      let nextParentStack = depthCharts.stackParentsById[parentStack.id];

      parentStackId = nextParentStack;
      parentStack = getState().stacks.lookup[parentStackId];
    }
  },

  setTabIndex: (index: number, options?: { tabId?: string }) => {
    let focusedTabs = getFocusedTabs();
    setTabIndex(index, { ...options, tabId: options?.tabId || focusedTabs.id });
  },

  reset: () => {
    // TODO
  },

  getStack: (stackId: string) => {
    return getStack(stackId);
  },

  getTabs: (tabId: string) => {
    return getTabs(tabId);
  },
};

export type TabsInstance = ReturnType<typeof getTabFns>;

export function createTabs({
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
    isGenerated: !id,
  };

  addTabs(initialTabs);

  return getTabFns(tabId);
}

function setActiveIndex(index: number, { tabId }: { tabId: string }) {
  setState((state) => {
    let tab = state.tabs.lookup[tabId];

    if (tab) {
      tab.activeIndex = index;
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
    };
  },
  setActiveIndex: () => {},
  reset: () => {},
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

  React.useEffect(() => {
    let tabs = getTabs(id);

    if (!tabs) {
      tabs = createTabs({ id });
      setTabsRef(tabs);
    }
  }, [id]);

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

function TabsScreens({
  children,
  style: styleProp,
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

  let style = React.useMemo(
    () => styleProp || StyleSheet.absoluteFill,
    [styleProp]
  );

  return (
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

function TabsTab({ children, ...props }: TabbarTabProps) {
  let tabId = React.useContext(TabIdContext);
  let index = React.useContext(TabScreenIndexContext);
  let tabs = useTabItem(tabId);

  let activeIndex = tabs?.activeIndex;
  let isActive = index === activeIndex;

  let onPress: () => void = React.useCallback(() => {
    setActiveIndex(index, { tabId });
  }, [tabId, index]);

  let defaultTabStyle: ViewStyle = React.useMemo(() => {
    return {
      flex: 1,
    };
  }, []);

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
  depthCharts.tabsByDepth[depth] = depthCharts.tabsByDepth[depth] || [];

  Object.keys(depthCharts.tabsByDepth).forEach((depth) => {
    depthCharts.tabsByDepth[depth] = depthCharts.tabsByDepth[depth].filter(
      (id) => id !== tabId
    );
  });

  depthCharts.tabParentsById[tabId] = parentTabId ?? "";

  if (isActive) {
    depthCharts.tabsByDepth[depth]?.push(tabId);
  }
}

function unregisterTabs({ tabId }: { tabId: string }) {
  for (let depth in depthCharts.tabsByDepth) {
    depthCharts.tabsByDepth[depth] = depthCharts.tabsByDepth[depth].filter(
      (id) => id !== tabId
    );
  }

  setState((state) => {
    let tabs = state.tabs.lookup[tabId];

    if (tabs?.isGenerated) {
      state.tabs.ids = state.tabs.ids.filter((id) => id !== tabId);
      delete state.tabs.lookup[tabId];
    }
  });
}

function getFocusedTabs() {
  let maxDepth = Math.max(
    ...Object.keys(depthCharts.tabsByDepth)
      .filter((key) => depthCharts.tabsByDepth[key].length > 0)
      .map(Number)
  );
  let tabIds = depthCharts.tabsByDepth[maxDepth];
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
  tab: TabbarTabProps["children"];
};

let defaultScreenContainerStyle = {
  flex: 1,
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

      <Tabs.Screens style={screenContainerStyle ?? defaultScreenContainerStyle}>
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
