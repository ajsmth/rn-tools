import * as React from "react";
import {
  BackHandler,
  PixelRatio,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutRectangle,
  type ViewStyle,
} from "react-native";
import {
  ScreenStackProps as RNScreenStackProps,
  Screen as RNScreen,
  ScreenProps as RNScreenProps,
  ScreenStackHeaderConfig as RNScreenStackHeaderConfig,
  ScreenStackHeaderConfigProps as RNScreenStackHeaderConfigProps,
} from "react-native-screens";
import ScreenStackNativeComponent from "react-native-screens/src/fabric/ScreenStackNativeComponent";

import {
  ActiveContext,
  DepthContext,
  TabIdContext,
  TabScreenIndexContext,
} from "./contexts";
import { DEFAULT_SLOT_NAME } from "./navigation-reducer";
import { useNavigationDispatch, useNavigationState } from "./navigation-store";
import type { StackItem } from "./types";
import { generateStackId, useSafeAreaInsetsSafe } from "./utils";

let StackIdContext = React.createContext<string>("");
let ScreenIdContext = React.createContext<string>("");

// Component returned from `react-native-screens` references `react-navigation` data structures in recent updates
// This is a workaround to make it work with our custom navigation
let RNScreenStack = React.memo(function RNScreenStack(
  props: RNScreenStackProps
) {
  let { children, gestureDetectorBridge, ...rest } = props;
  let ref = React.useRef(null);

  React.useEffect(() => {
    if (gestureDetectorBridge) {
      gestureDetectorBridge.current.stackUseEffectCallback(ref);
    }
  });

  return (
    <ScreenStackNativeComponent {...rest} ref={ref}>
      {children}
    </ScreenStackNativeComponent>
  );
});

type StackRootProps = {
  children: React.ReactNode;
  id?: string;
};

let useStackInternal = (stackId = "") => {
  let stack: StackItem | undefined = useNavigationState(
    (state) => state.stacks.lookup[stackId]
  );
  return stack;
};

function StackRoot({ children, id }: StackRootProps) {
  let idRef = React.useRef(id || generateStackId());
  let stack = useStackInternal(idRef.current);

  let isActive = React.useContext(ActiveContext);
  let parentDepth = React.useContext(DepthContext);
  let parentStackId = React.useContext(StackIdContext);

  let depth = parentDepth + 1;
  let stackId = idRef.current;
  let parentTabId = React.useContext(TabIdContext);
  let tabIndex = React.useContext(TabScreenIndexContext);

  let dispatch = useNavigationDispatch();

  React.useLayoutEffect(() => {
    if (!stack) {
      dispatch({ type: "CREATE_STACK_INSTANCE", stackId: idRef.current });
    }
  }, [stack, dispatch]);

  React.useEffect(() => {
    if (stack != null) {
      dispatch({
        type: "REGISTER_STACK",
        depth,
        isActive,
        stackId: stack.id,
        parentStackId,
        parentTabId,
        tabIndex,
      });
    }
  }, [stack, depth, isActive, parentStackId, parentTabId, tabIndex, dispatch]);

  React.useEffect(() => {
    return () => {
      if (stackId != null) {
        dispatch({ type: "UNREGISTER_STACK", stackId });
      }
    };
  }, [stackId, dispatch]);

  if (!stack) {
    return null;
  }

  return (
    <StackIdContext.Provider value={stack.id}>
      <DepthContext.Provider value={depth}>
        <ActiveContext.Provider value={isActive}>
          {children}
        </ActiveContext.Provider>
      </DepthContext.Provider>
    </StackIdContext.Provider>
  );
}

function StackScreens({ style: styleProp, ...props }: RNScreenStackProps) {
  let style = React.useMemo(
    () => styleProp || StyleSheet.absoluteFill,
    [styleProp]
  );

  return <RNScreenStack {...props} style={style} />;
}

let defaultScreenStyle: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "white",
};

export type StackScreenProps = RNScreenProps;

let StackScreen = React.memo(function StackScreen({
  children,
  style: styleProp,
  gestureEnabled = true,
  onDismissed: onDismissedProp,
  ...props
}: StackScreenProps) {
  let stackId = React.useContext(StackIdContext);
  let screenId = React.useContext(ScreenIdContext);
  let stack = useStackInternal(stackId);

  let dispatch = useNavigationDispatch();

  let isActive = React.useContext(ActiveContext);

  let onDismissed: RNScreenProps["onDismissed"] = React.useCallback(
    (e) => {
      dispatch({ type: "POP_SCREEN_BY_KEY", key: screenId });
      onDismissedProp?.(e);
    },
    [onDismissedProp, dispatch, screenId]
  );

  React.useEffect(() => {
    function backHandler() {
      if (gestureEnabled && isActive && stack?.screens.length > 0) {
        dispatch({ type: "POP_SCREEN_BY_KEY", key: screenId });
        return true;
      }

      return false;
    }

    BackHandler.addEventListener("hardwareBackPress", backHandler);

    return () => {
      BackHandler.removeEventListener("hardwareBackPress", backHandler);
    };
  }, [gestureEnabled, stack, screenId, isActive, dispatch]);

  let style = React.useMemo(() => styleProp || defaultScreenStyle, [styleProp]);

  return (
    // @ts-expect-error - Ref typings in RNScreens
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
});

let useStackScreens = (stackId = "", slotName: string) => {
  return useNavigationState((state) => {
    let stack = state.stacks.lookup[stackId];
    return (
      stack?.screens
        .map((screenId) => state.screens.lookup[screenId])
        .filter((s) => s && s.slotName === slotName) ?? []
    );
  });
};

let StackSlot = React.memo(function StackSlot({
  slotName = DEFAULT_SLOT_NAME,
}: {
  slotName?: string;
}) {
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
});

let StackScreenHeader = React.memo(function StackScreenHeader({
  ...props
}: RNScreenStackHeaderConfigProps) {
  let layout = useWindowDimensions();
  let insets = useSafeAreaInsetsSafe();

  let headerHeight = React.useMemo(() => {
    if (Platform.OS === "android") {
      return 0;
    }

    return getDefaultHeaderHeight(layout, false, insets.top);
  }, [layout, insets]);

  return (
    <React.Fragment>
      <RNScreenStackHeaderConfig {...props} />
      <View style={{ height: headerHeight }} />
    </React.Fragment>
  );
});

type StackNavigatorProps = Omit<StackRootProps, "children"> & {
  rootScreen: React.ReactElement<unknown>;
};

let StackNavigator = React.memo(function StackNavigator({
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
});

export let Stack = {
  Root: StackRoot,
  Screens: StackScreens,
  Screen: StackScreen,
  Header: StackScreenHeader,
  Slot: StackSlot,
  Navigator: StackNavigator,
};

// `onLayout` event does not return a value for the native header component
// This function is copied from react-navigation to get the default header heights
function getDefaultHeaderHeight(
  layout: Pick<LayoutRectangle, "width" | "height">,
  // TODO - handle modal headers and substacks
  modalPresentation: boolean,
  topInset: number
): number {
  let headerHeight;

  // On models with Dynamic Island the status bar height is smaller than the safe area top inset.
  let hasDynamicIsland = Platform.OS === "ios" && topInset > 50;
  let statusBarHeight = hasDynamicIsland
    ? topInset - (5 + 1 / PixelRatio.get())
    : topInset;

  let isLandscape = layout.width > layout.height;

  if (Platform.OS === "ios") {
    if (Platform.isPad || Platform.isTV) {
      if (modalPresentation) {
        headerHeight = 56;
      } else {
        headerHeight = 50;
      }
    } else {
      if (isLandscape) {
        headerHeight = 32;
      } else {
        if (modalPresentation) {
          headerHeight = 56;
        } else {
          headerHeight = 44;
        }
      }
    }
  } else {
    headerHeight = 64;
  }

  return headerHeight + statusBarHeight;
}
