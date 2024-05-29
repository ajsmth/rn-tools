import * as React from "react";
import { BackHandler, StyleSheet, type ViewStyle } from "react-native";
import {
  ScreenStack as RNScreenStack,
  ScreenStackProps as RNScreenStackProps,
  Screen as RNScreen,
  ScreenProps as RNScreenProps,
  ScreenStackHeaderConfig as RNScreenStackHeaderConfig,
  ScreenStackHeaderConfigProps as RNScreenStackHeaderConfigProps,
} from "react-native-screens";

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

let defaultScreenStyle: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "white",
};

type StackScreenProps = RNScreenProps;

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
}: { children: React.ReactNode } & RNScreenStackHeaderConfigProps) {
  return <RNScreenStackHeaderConfig {...props} />;
});

export let Stack = {
  Root: StackRoot,
  Screens: StackScreens,
  Screen: StackScreen,
  Header: StackScreenHeader,
  Slot: StackSlot,
};

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
