import * as React from "react";
import { StyleSheet } from "react-native";
import {
  ScreenStack,
  ScreenStackProps,
  ScreenProps as RNScreenProps,
  Screen,
  ScreenStackHeaderConfig,
  ScreenStackHeaderConfigProps,
} from "react-native-screens";
import { createStackStore, StackItem, StackStore } from "@rn-toolkit/core";

export type ScreenProps<T = any> = T & {
  setHeaderProps: (updates: ScreenStackHeaderConfigProps) => void;
  setScreenProps: (updates: RNScreenProps) => void;
  push: (
    component: (props: ScreenProps) => React.ReactElement<any>,
    options: Omit<ScreenStackItem<T>, "component">
  ) => Promise<void>;
  pop: () => Promise<void>;
  focused: boolean;
} 

export type ScreenStackItem<T = any> = {
  key?: string;
  component: (props: ScreenProps<T>) => React.ReactElement<any>;
  headerProps?: ScreenStackHeaderConfigProps;
  screenProps?: RNScreenProps;
  props?: T;
};

export type StackNavigator = StackStore<ScreenStackItem>;

export function createStackNavigator() {
  const stack = createStackStore<ScreenStackItem>();

  function Navigator(props: ScreenStackProps) {
    const { children, ...rest } = props;
    let [screens, setScreens] = React.useState<StackItem<ScreenStackItem>[]>(
      []
    );

    React.useEffect(() => {
      const unsub = stack.store.subscribe(({ stack }) => {
        setScreens(
          stack.filter(
            (s: any) => s.status !== "popped" && s.status !== "popping"
          )
        );
      });

      return () => unsub();
    });

    return (
      <ScreenStack style={{ flex: 1 }} {...rest}>
        <Screen style={StyleSheet.absoluteFill}>{children}</Screen>
        {screens.map((screen, index, arr) => {
          const focused = index === arr.length - 1;
          return (
            <ScreenComponent
              key={screen.id}
              screen={screen}
              focused={focused}
            />
          );
        })}
      </ScreenStack>
    );
  }

  function ScreenComponent(props: {
    screen: StackItem<ScreenStackItem>;
    focused?: boolean;
  }) {
    const { screen, focused } = props;

    const setHeaderProps = React.useCallback(
      (updates: ScreenStackHeaderConfigProps) => {
        screen.actions.update(screen.id, { headerProps: updates });
      },
      [screen.actions]
    );

    const setScreenProps = React.useCallback(
      (updates: RNScreenProps) =>
        screen.actions.update(screen.id, { screenProps: updates }),
      [screen.actions]
    );

    const Component = screen.data.component;

    const popEnd = React.useCallback(() => {
      return screen.actions.popEnd(screen.id);
    }, [screen.id]);

    const pushEnd = React.useCallback(() => {
      return screen.actions.pushEnd(screen.id);
    }, [screen.id]);

    return (
      <Screen
        key={screen.id}
        style={StyleSheet.absoluteFill}
        onDismissed={popEnd}
        onAppear={pushEnd}
        {...screen.data.screenProps}
      >
        <ScreenStackHeaderConfig {...screen.data.headerProps} />
        <Component
          setHeaderProps={setHeaderProps}
          setScreenProps={setScreenProps}
          push={Stack.push}
          pop={Stack.pop}
          focused={focused}
          {...screen.data.props}
        />
      </Screen>
    );
  }

  async function push<T = any>(
    component: (props: ScreenProps<T>) => React.ReactElement<any>,
    options?: Omit<ScreenStackItem<T>, "component">
  ) {
    const item = stack.actions.push({
      component,
      headerProps: options?.headerProps ?? {},
      screenProps: options?.screenProps ?? {},
      props: options?.props ?? {},
    });

    return await item.promises.push;
  }

  async function pop() {
    const item = stack.actions.pop();
    return item?.promises.pop;
  }

  const Stack = {
    push,
    pop,
    Navigator,
  };

  return { Stack, stack };
}
