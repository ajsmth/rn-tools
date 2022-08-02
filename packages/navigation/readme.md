# @rn-toolkit/navigation

An alternative approach to navigation with special attention to routing

## Install

```bash
expo install @rn-toolkit/navigation react-native-screens
```

## API

Every stack in your application is created with the `createStackNavigator` function:

```tsx
import * as React from "react";
import { createStackNavigator } from "@rn-toolkit/navigation";

const MainStack = createStackNavigator();

function App() {
  return (
    <MainStack.Navigator>
      <MainScreen />
    </MainStack.Navigator>
  );
}
```

Additional screens are not defined as children of a Stack - instead they are pushed onto the stack like this:

```tsx
MainStack.push(MyScreen);
```

You can set props on the screen you are pushing:

```tsx
MainStack.push(MyScreen, {
  headerProps: {
    backTitle: "Back to MyScreen!",
  },
  screenProps: {
    style: {
      backgroundColor: "red",
    },
  },
  props: {
    text: "Hi",
  },
});
```

The `headerProps` and `screenProps` options correspond to the header and screen props available in `react-native-screens`

Every screen pushed this way receives special props:

```tsx
import { ScreenProps } from "@rn-toolkit/navigation";

type MyProps = {
  text: string;
};

function MyScreen(props: ScreenProps<MyProps>) {
  const { setScreenProps, setHeaderProps, push, pop, focused, text } = props;

  return <Text>{text}</Text>;
}
```

Tab navigators are created with `createTabNavigator()`:

```tsx
import { createTabNavigator } from "@rn-toolkit/navigation";

const Tabs = createTabNavigator();

function MyTabs() {
  return (
    <Tabs.Navigator>
      <Tabs.Screen>
        <HomeScreen title="Home" />
      </Tabs.Screen>
      <Tabs.Screen>
        <HomeScreen title="Settings" />
      </Tabs.Screen>
    </Tabs.Navigator>
  );
}
```

Tabbar items are declared like this:

```tsx
function MyTabbar() {
  return (
    <Tabs.Tabbar>
      <View>
        <Tabs.Tab>
          {({ onPress, isActive }) => (
            <Pressable onPress={onPress}>
              <Text>Home</Text>
            </Pressable>
          )}
        </Tabs.Tab>
        <Tabs.Tab>
          {({ onPress, isActive }) => <Pressable onPress={onPress}></Pressable>}
        </Tabs.Tab>
      </View>
    </Tabs.Tabbar>
  );
}
```

You can also jump to specific tab imperatively:

```tsx
Tabs.jumpTo(1);
```

## Routing

The `Router` component registers route handlers. When your app receives a deep link it will check these routes and invoke any handler that matches:

```tsx
import { Router } from "@rn-toolkit/navigation";
import { MainStack } from "./main";

function App() {
  <Router
    routes={{
      "/hello/:name": async ({ params, url, state, path, next }) => {
        const { name } = params;
        const id = url.searchParams.get("id");
        await MainStack.push(MyScreen, { props: { id, name } });
        next();
      },
    }}
  >
    <MyApp />
  </Router>;
}
```

You might have cases where two `Router` components need to handle the same path. In these cases, a handler can invoke the `next` function to allow parent routers to invoke their handlers too.

## Navigate

The `navigate` function will also invoke your route handlers just like a deep link:

```tsx
import { navigate } from "@rn-toolkit/navigation";

navigate(`/hello/world?id=123`, { some: "state" });
```
