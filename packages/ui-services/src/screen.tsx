import * as React from "react";
import {
  ScreenStack,
  ScreenStackProps,
  ScreenStackHeaderConfigProps,
  ScreenProps,
  Screen,
  ScreenStackHeaderConfig,
} from "react-native-screens";
import { StyleSheet } from "react-native";

import {
  createAsyncStack,
  Stack as StackType,
  StackItem,
} from "./create-async-stack";
import { useStackItems } from "./use-stack-items";

type Props = {
  component: React.JSXElementConstructor<StackItem>;
  headerProps?: ScreenStackHeaderConfigProps;
  screenProps?: ScreenProps;
};

export type ScreenContainerProps = ScreenStackProps & {};

export function createScreenStack() {
  const Stack = createAsyncStack<Props>();

  function push(
    component: React.JSXElementConstructor<StackItem>,
    options?: Omit<Props, "component">
  ) {
    return Stack.push({ component, ...options });
  }

  const Screens = {
    push,
    pop: Stack.pop,
  };

  function ScreenContainer({ children, ...props }: ScreenContainerProps) {
    const stackItems = useStackItems(Stack);

    return (
      <ScreenStack {...props} style={{ flex: 1 }}>
        <Screen style={StyleSheet.absoluteFill}>{children}</Screen>
        {stackItems
          .filter(
            (item) => item.status !== "popping" && item.status !== "popped"
          )
          .map((item) => {
            const {
              component: Component,
              screenProps,
              headerProps,
              ...props
            } = item.data;
            return (
              <Screen
                key={item.key}
                {...props}
                {...screenProps}
                onDismissed={item.onPopEnd}
                onAppear={item.onPushEnd}
              >
                <ScreenStackHeaderConfig {...headerProps} />
                <Component {...item} pop={Screens.pop} />
              </Screen>
            );
          })}
      </ScreenStack>
    );
  }

  return {
    Screens,
    ScreenContainer,
  };
}
