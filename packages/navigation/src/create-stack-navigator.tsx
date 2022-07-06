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
import { createStackStore, StackItem } from "./create-stack-store";

export type ScreenProps<T = any> = {
  setHeaderProps: (updates: ScreenStackHeaderConfigProps) => void;
  setScreenProps: (updates: RNScreenProps) => void;
  push: (
    component: (props: ScreenProps) => React.ReactElement<any>,
    options: Omit<ScreenOptions, "component">
  ) => Promise<void>;
  pop: () => Promise<void>;
  focused: boolean;
} & T;

type ScreenOptions = {
  key?: string;
  component: (props: ScreenProps) => React.ReactElement<any>;
  headerProps?: ScreenStackHeaderConfigProps;
  screenProps?: RNScreenProps;
  props: any;
};

type NavigatorProps = {};

export function createStackNavigator() {
  const store = createStackStore();

  function Navigator(props: ScreenStackProps & NavigatorProps) {
    const { children, ...rest } = props;
    let [screens, setScreens] = React.useState<any[]>([]);

    React.useEffect(() => {
      const unsub = store.subscribe(({ stack }: any) => {
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
    screen: StackItem<ScreenProps>;
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

    return (
      <Screen
        key={screen.id}
        style={StyleSheet.absoluteFill}
        onDismissed={() => screen.actions.popEnd(screen.id)}
        onAppear={() => screen.actions.pushEnd(screen.id)}
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

  async function push(
    component: (props: ScreenProps) => React.ReactElement<any>,
    options?: Omit<ScreenOptions, "component">
  ) {
    const item = store.push({
      component,
      headerProps: options?.headerProps ?? {},
      screenProps: options?.screenProps ?? {},
      props: options?.props ?? {},
    });

    return await item.promises.push;
  }

  async function pop() {
    const item = store.pop();
    return item?.promises.pop;
  }

  const Stack = {
    push,
    pop,
    getState: store.getState,
    setState: store.setState,
    subscribe: store.subscribe,
    Navigator,
  };

  return Stack;
}
