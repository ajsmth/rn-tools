# @rn-toolkit/navigation

A set of minimal navigation utilities for React Native. Built with `react-native-screens`. Not as robust as a library like `react-navigation`, designed with flexibility in mind.

## Why

- Simple typings
- Small API for navigation
- Full control over navigation behaviour

## Installation

```bash
expo install @rn-toolkit/navigation react-native-screens
```

## Basic Usage

For the basic usage, the `StackNavigator` and `TabNavigator` components will get you up and running quickly. These components are wrappers around the base `Stack` and `Tabs` components. If you need more control you can always use the base components directly - examples for this are provided in the "Advanced" section below.

**Note**: Most apps will likely only need one or two stack navigators and a single tab navigator, but this library is designed to let you nest them as needed.

### Stack Navigator

The `StackNavigator` component is used to manage a stack of screens. The `rootScreen` prop is the initial screen that will be rendered.

Other screens can be pushed ontop of the root screen by the `navigation.pushScreen` method. Similarly screens can be popped off the stack with the `navigation.popScreen` method.

`navigation.popScreen` can be passed a number to pop multiple screens at once. If the number is greater than the number of screens in the stack, all screens will be popped. `navigation.popScreen(-1)` will pop all screens that have been pushed onto the stack.

```tsx
import { View, Text, Button } from "@react-native";
import { StackNavigator, navigation } from "@rn-toolkit/navigation";

function App() {
  return <StackNavigator rootScreen={<MyScreen title="Root Screen" />} />;
}

function MyScreen({
  title,
  isRoot = true,
}: {
  title: string;
  isRoot: boolean;
}) {
  function pushScreen() {
    navigation.pushScreen(<MyScreen title="Pushed screen" isRoot={false} />);
  }

  function popScreen() {
    navigation.popScreen();
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{title}</Text>
      <Button title="Push screen" onPress={pushScreen} />
      {!isRoot && <Button title="Pop screen" onPress={popScreen} />}
    </View>
  );
}
```

### Tab Navigator

Tabs can be created by passing an array of screens to the `TabNavigator` component. Each screen should have a `key` and a `screen` prop. The `tab` prop is a function that returns the tab component.

```tsx
import { View, Text, Button } from "@react-native";
import {
  StackNavigator,
  TabNavigator,
  navigation,
} from "@rn-toolkit/navigation";

function App() {
  return <StackNavigator rootScreen={<MyTabs />} />;
}

function MyTabs() {
  return (
    <TabNavigator
      screens={[
        {
          key: "1",
          screen: <MyScreen title="Screen 1" />,
          tab: ({ isActive }) => (
            <View className="flex-1 p-4 items-center">
              <Text className={isActive ? "font-bold" : "font-medium"}>1</Text>
            </View>
          ),
        },
        {
          key: "2",
          screen: <MyScreen title="Screen 2" />,
          tab: ({ isActive }) => (
            <View className="p-4 items-center">
              <Text className={isActive ? "font-bold" : "font-medium"}>2</Text>
            </View>
          ),
        },
        {
          key: "3",
          screen: <MyScreen title="Screen 3" />,
          tab: ({ isActive }) => (
            <View className="p-4 items-center">
              <Text className={isActive ? "font-bold" : "font-medium"}>3</Text>
            </View>
          ),
        },
      ]}
    />
  );
}

function MyScreen({
  title,
  isRoot = true,
}: {
  title: string;
  isRoot: boolean;
}) {
  function pushScreen() {
    navigation.pushScreen(<MyScreen title="Pushed screen" isRoot={false} />);
  }

  function popScreen() {
    navigation.popScreen();
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{title}</Text>
      <Button title="Push screen" onPress={pushScreen} />
      {!isRoot && <Button title="Pop screen" onPress={popScreen} />}
    </View>
  );
}
```

Note that our component from the previous example still pushes screens onto the stack as TabNavigator and StackNavigator are composable. If you want each tab to have its own independent stack of screens, you can nest `StackNavigator` components in the `TabNavigator` - the screen components will push to the right stack.

```tsx
function MyTabs() {
  return (
    <TabNavigator
      screens={[
        {
          key: "1",
          // Wrap the screen in a StackNavigator:
          screen: <StackNavigator rootScreen={<MyScreen title="Screen 1" />} />,
          tab: ({ isActive }) => (
            <View className="flex-1 p-4 items-center">
              <Text className={isActive ? "font-bold" : "font-medium"}>1</Text>
            </View>
          ),
        },
        // ...other screens
      ]}
    />
  );
}
```

### Targeting specific StackNavigators

If you want to push to a specific stack in your app for some reason, you can target it with an `id` prop and pass this as an option when pushing the screen. This is useful when you have multiple `StackNavigator` components in your app.

```tsx
function App() {
  return (
    <StackNavigator id="main" rootScreen={<MyScreen title="Root Screen" />} />
  );
}

// Customize your helper functions to suite your needs
// This function is just an example but could be imported in any screen where we might want to push to the main stack
function pushToMainStack(
  screenElement: React.ReactElement<unknown>,
  options: PushScreenOptions
) {
  navigation.pushScreen(screenElement, { stackId: "main", ...options });
}
```

### Pushing a screen once

One tradeoff with imperative methods like `navigation.pushScreen` is that you might accidentally push the same screen multiple times. To avoid this, you can use the `key` option which will only push the screen if it is not already in the stack.

```tsx
function pushThisScreenOnce() {
  navigation.pushScreen(<MyScreen title="Pushed screen" />, {
    key: "unique-key",
  });
}
```

### Targeting specific TabNavigators

Similar to `StackNavigator`, passing an `id` prop to a `TabNavigator` will allow you to target it and update the active tab.

```tsx
function App() {
  return <TabNavigator id="main" screens={tabs} />;
}

function switchToTab(tabIndex: number) {
  navigation.setTabIndex(tabIndex, { tabId: "main" });
}
```

## Advanced Usage

For more advanced usage, you can use the exported `Stack` and `Tabs` components directly. These components provide more control over how the peices of your navigation are rendered - however there is more upfront work of setting things up correctly.

### Authentication Flow

You can use the `Stack` component to conditionally render screens based on the user's state. In this case we will render the authenticated part of the app based on the `isLoggedIn` value in our example. Under the hood this is using `react-native-screens` components to handle pushing and popping screens natively.

```tsx
import * as React from "react";
import { Stack } from "@rn-toolkit/navigation";

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  return (
    <Stack.Root>
      <Stack.Screens>
        <Stack.Screen>
          <MyLoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />
        </Stack.Screen>

        {isLoggedIn && (
          <>
            <Stack.Screen>
              <MyAuthenticatedApp />
            </Stack.Screen>
            <Stack.Slot />
          </>
        )}
      </Stack.Screens>
    </Stack.Root>
  );
}
```

You might have noticed the `Stack.Slot` component in the example above. `Stack.Slot` will render screens that are pushed by the `navigation.pushScreen` method. Since `Slot` is a component, it too can be conditionally rendered to control which screens are visible at any given time.

### Deep Linking

Deep linking can be implemented by writing a custom route handler and using the `navigation.pushScreen` methods to navigate to the correct screen.

```tsx

```
