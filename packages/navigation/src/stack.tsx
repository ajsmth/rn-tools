import * as React from "react";
import {
  BackHandler,
  Platform,
  StyleSheet,
  View,
  type ImageProps,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import {
  ScreenStackProps as RNScreenStackProps,
  Screen as RNScreen,
  ScreenProps as RNScreenProps,
  ScreenStackHeaderConfig as RNScreenStackHeaderConfig,
  ScreenStackHeaderLeftView as RNScreenStackHeaderLeftView,
  ScreenStackHeaderRightView as RNScreenStackHeaderRightView,
  ScreenStackHeaderCenterView as RNScreenStackHeaderCenterView,
  ScreenStackHeaderConfigProps as RNScreenStackHeaderConfigProps,
  ScreenStackHeaderBackButtonImage as RNScreenStackHeaderBackButtonImage,
  type ScreenProps,
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
import { generateStackId } from "./utils";

let StackIdContext = React.createContext<string>("");
let ScreenIdContext = React.createContext<string>("");

// Component returned from `react-native-screens` references `react-navigation` data structures in recent updates
// This is a workaround to make it work with our custom navigation
let RNScreenStack = React.memo(function RNScreenStack(
  props: RNScreenStackProps,
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

export type StackRootProps = {
  children: React.ReactNode;
  id?: string;
};

let useStackInternal = (stackId = "") => {
  let stack: StackItem | undefined = useNavigationState(
    (state) => state.stacks.lookup[stackId],
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

export type StackScreensProps = RNScreenStackProps;

function StackScreens({ style: styleProp, ...props }: StackScreensProps) {
  let style = React.useMemo(
    () => styleProp || StyleSheet.absoluteFill,
    [styleProp],
  );

  return <RNScreenStack {...props} style={style} />;
}

let defaultScreenStyle: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "white",
};

export type StackScreenProps = RNScreenProps & {
  header?: React.ReactElement<StackScreenHeaderProps>;
};

let HeaderHeightContext = React.createContext<number>(0);

let StackScreen = React.memo(function StackScreen({
  children,
  style: styleProp,
  gestureEnabled = true,
  onDismissed: onDismissedProp,
  onHeaderHeightChange: onHeaderHeightChangeProp,
  header,
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
    [onDismissedProp, dispatch, screenId],
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

  let parentHeaderHeight = React.useContext(HeaderHeightContext);
  let [headerHeight, setHeaderHeight] = React.useState(parentHeaderHeight);

  let onHeaderHeightChange: ScreenProps["onHeaderHeightChange"] =
    React.useCallback(
      (e) => {
        Platform.OS === "ios" &&
          e.nativeEvent.headerHeight > 0 &&
          setHeaderHeight(e.nativeEvent.headerHeight);
        onHeaderHeightChangeProp?.(e);
      },
      [onHeaderHeightChangeProp],
    );

  let style = React.useMemo(
    () => [
      defaultScreenStyle,
      { paddingTop: headerHeight || parentHeaderHeight },
      styleProp,
    ],
    [styleProp, headerHeight, parentHeaderHeight],
  );

  return (
    <HeaderHeightContext.Provider value={headerHeight}>
      <RNScreen
        {...props}
        style={style}
        activityState={isActive ? 2 : 0}
        gestureEnabled={gestureEnabled}
        onDismissed={onDismissed}
        onHeaderHeightChange={onHeaderHeightChange}
      >
        {header}
        {children}
      </RNScreen>
    </HeaderHeightContext.Provider>
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

export type StackScreenHeaderProps = RNScreenStackHeaderConfigProps;

let StackScreenHeader = React.memo(function StackScreenHeader({
  ...props
}: StackScreenHeaderProps) {
  return <RNScreenStackHeaderConfig {...props} />;
});

let StackScreenHeaderLeft = React.memo(function StackScreenHeaderLeft({
  ...props
}: ViewProps) {
  return <RNScreenStackHeaderLeftView {...props} />;
});

let StackScreenHeaderCenter = React.memo(function StackScreenHeaderCenter({
  ...props
}: ViewProps) {
  return <RNScreenStackHeaderCenterView {...props} />;
});

let StackScreenHeaderRight = React.memo(function StackScreenHeaderRight({
  ...props
}: ViewProps) {
  return <RNScreenStackHeaderRightView {...props} />;
});

let ScreenStackHeaderBackButtonImage = React.memo(
  function ScreenStackHeaderBackButtonImage(props: ImageProps) {
    return <RNScreenStackHeaderBackButtonImage {...props} />;
  },
);

export type StackNavigatorProps = Omit<StackRootProps, "children"> & {
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
  HeaderLeft: StackScreenHeaderLeft,
  HeaderCenter: StackScreenHeaderCenter,
  HeaderRight: StackScreenHeaderRight,
  HeaderBackImage: ScreenStackHeaderBackButtonImage,
  Slot: StackSlot,
  Navigator: StackNavigator,
};
