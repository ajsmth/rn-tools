import * as React from "react";
import {
  ScreenStack,
  ScreenStackProps,
  ScreenProps as RNScreenProps,
  Screen,
  ScreenStackHeaderConfig,
} from "react-native-screens";
import { StyleSheet } from "react-native";

import { createAsyncStack, Stack, StackItem } from "./create-async-stack";
import { useStackItems } from "./use-stack-items";
import { ScreenOptions, ScreenProps, ScreenStackItem } from "./types";

export type ScreenContainerProps = ScreenStackProps & {};

export function createStack() {
  const screenStack = createAsyncStack<ScreenStackItem>();
  const screenService = createService(screenStack);

  function Provider({ children }: any) {
    return (
      <Context.Provider value={screenService}>{children}</Context.Provider>
    );
  }

  function Container({ children, ...props }: ScreenContainerProps) {
    const stackItems = useStackItems(screenStack);

    return (
      <Provider>
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
                  <Component
                    status={item.status}
                    pop={screenService.pop}
                    animatedValue={item.animatedValue}
                  />
                </Screen>
              );
            })}
        </ScreenStack>
      </Provider>
    );
  }

  return {
    ...screenService,
    Container,
    Provider,
  };
}

type StackContext = {
  push: (
    component: React.JSXElementConstructor<ScreenProps>,
    options?: ScreenOptions
  ) => StackItem<ScreenStackItem>;
  pop: (amount?: number) => StackItem<ScreenStackItem>[];
};

function createService(stack: Stack<ScreenStackItem>): StackContext {
  return {
    push: (
      component: React.JSXElementConstructor<ScreenProps>,
      options?: ScreenOptions
    ) => {
      return stack.push({ component, ...options });
    },
    pop: stack.pop,
  };
}

const Context = React.createContext<StackContext | null>(null);

export const useStack = () => {
  const context = React.useContext(Context);

  if (!context) {
    throw new Error(
      `useStack() must be used within a <StackProvider /> context`
    );
  }

  return context;
};
