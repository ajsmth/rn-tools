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
  Screen as RNScreen,
  ScreenProps as RNScreenProps,
  ScreenContainer as RNScreenContainer,
  ScreenContainerProps as RNScreenContainerProps,
} from "react-native-screens";

import {
  ActiveContext,
  DepthContext,
  TabIdContext,
  TabScreenIndexContext,
} from "./contexts";
import {
  useGetNavigationStore,
  useNavigationDispatch,
  useNavigationState,
} from "./navigation-store";
import { generateTabId, useSafeAreaInsetsSafe } from "./utils";

export type TabsRootProps = {
  children: React.ReactNode;
  id?: string;
};

let useTabsInternal = (tabId = "") =>
  useNavigationState((state) => {
    let tab = state.tabs.lookup[tabId];

    if (!tab) {
      return null;
    }

    return tab;
  });

let TabsRoot = React.memo(function TabsRoot({ children, id }: TabsRootProps) {
  let tabIdRef = React.useRef(id || generateTabId());
  let tabId = tabIdRef.current;
  let tabs = useTabsInternal(tabId);
  let dispatch = useNavigationDispatch();

  React.useEffect(() => {
    if (!tabs) {
      dispatch({ type: "CREATE_TAB_INSTANCE", tabId: tabId });
    }
  }, [tabs, tabId, dispatch]);

  let depth = React.useContext(DepthContext);
  let isActive = React.useContext(ActiveContext);
  let parentTabId = React.useContext(TabIdContext);

  React.useEffect(() => {
    if (tabs != null) {
      dispatch({
        type: "REGISTER_TAB",
        depth,
        isActive,
        tabId: tabs.id,
        parentTabId,
      });
    }
  }, [tabs, depth, isActive, parentTabId, dispatch]);

  React.useEffect(() => {
    return () => {
      if (tabId != null) {
        dispatch({ type: "UNREGISTER_TAB", tabId });
      }
    };
  }, [tabId, dispatch]);

  if (!tabs) {
    return null;
  }

  return (
    <TabIdContext.Provider value={tabs.id}>{children}</TabIdContext.Provider>
  );
});

let defaultScreenContainerStyle = {
  flex: 1,
};

export type TabsScreensProps = RNScreenContainerProps;

function TabsScreens({ children, ...props }: TabsScreensProps) {
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

export type TabsScreenProps = RNScreenProps;

let TabsScreen = React.memo(function TabsScreen({
  children,
  style: styleProp,
  ...props
}: TabsScreenProps) {
  let dispatch = useNavigationDispatch();

  let tabId = React.useContext(TabIdContext);
  let tabs = useTabsInternal(tabId);
  let getNavigationStore = useGetNavigationStore();
  let index = React.useContext(TabScreenIndexContext);

  let parentIsActive = React.useContext(ActiveContext);
  let activeIndex = tabs?.activeIndex;
  let isActive = index === activeIndex;

  React.useEffect(() => {
    function backHandler() {
      // Use getter to register the handler once on mount
      // Prevents it from overriding child screen handlers
      let tabs = getNavigationStore().tabs.lookup[tabId];
      if (tabs && tabs.history.length > 0) {
        dispatch({ type: "TAB_BACK", tabId });
        return true;
      }

      return false;
    }

    BackHandler.addEventListener("hardwareBackPress", backHandler);

    return () => {
      BackHandler.removeEventListener("hardwareBackPress", backHandler);
    };
  }, [tabId, dispatch, getNavigationStore]);

  let style = React.useMemo(
    () => styleProp || StyleSheet.absoluteFill,
    [styleProp]
  );

  return (
    // @ts-expect-error - Ref typings in RNScreens
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
});

export let defaultTabbarStyle: ViewStyle = {
  flexDirection: "row",
  backgroundColor: "white",
};


let TabsTabbar = React.memo(function TabsTabbar({
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
});

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

let TabsTab = React.memo(function TabsTab({
  children,
  ...props
}: TabbarTabProps) {
  let dispatch = useNavigationDispatch();

  let tabId = React.useContext(TabIdContext);
  let index = React.useContext(TabScreenIndexContext);
  let tabs = useTabsInternal(tabId);

  let activeIndex = tabs?.activeIndex;
  let isActive = index === activeIndex;

  let onPress: () => void = React.useCallback(() => {
    dispatch({ type: "SET_TAB_INDEX", tabId, index });

    if (isActive) {
      dispatch({ type: "POP_ACTIVE_TAB", tabId, index });
    }
  }, [tabId, index, dispatch, isActive]);

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
});


export type TabNavigatorProps = Omit<TabsRootProps, "children"> & {
  screens: TabNavigatorScreenOptions[];
  tabbarPosition?: "top" | "bottom";
  tabbarStyle?: ViewProps["style"];
};

export type TabNavigatorScreenOptions = {
  key: string;
  screen: React.ReactElement<unknown>;
  tab: (props: { isActive: boolean; onPress: () => void }) => React.ReactNode;
};

let TabNavigator = React.memo(function TabNavigator({
  screens,
  tabbarPosition = "bottom",
  tabbarStyle: tabbarStyleProp,
  ...rootProps
}: TabNavigatorProps) {
  let insets = useSafeAreaInsetsSafe();

  let tabbarStyle = React.useMemo(() => {
    return [
      defaultTabbarStyle,
      {
        paddingBottom: tabbarPosition === "bottom" ? insets.bottom : 0,
        paddingTop: tabbarPosition === "top" ? insets.top : 0,
      },
      tabbarStyleProp,
    ];
  }, [tabbarPosition, tabbarStyleProp, insets]);

  return (
    <Tabs.Root {...rootProps}>
      {tabbarPosition === "top" && (
        <Tabs.Tabbar style={tabbarStyle}>
          {screens.map((screen) => {
            return <Tabs.Tab key={screen.key}>{screen.tab}</Tabs.Tab>;
          })}
        </Tabs.Tabbar>
      )}

      <Tabs.Screens>
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
});

export let Tabs = {
  Root: TabsRoot,
  Screens: TabsScreens,
  Screen: TabsScreen,
  Tabbar: TabsTabbar,
  Tab: TabsTab,
  Navigator: TabNavigator,
};
