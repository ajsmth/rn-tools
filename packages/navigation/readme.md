# @rn-toolkit/navigation

A set of useful navigation components for React Native. Built with `react-native-screens`. Designed with flexibility in mind. Build your own abstractions on top of this!

## Installation

```bash
yarn expo install @rn-toolkit/navigation react-native-screens
```

## Basic Usage

For basic usage, the exported `StackNavigator` and `TabNavigator` components will get you up and running quickly. For more advanced use cases, you can use the `Stack` and `Tabs` base components - more on this in the [Advanced Usage](#advanced-usage) section

### Stack Navigator

The `StackNavigator` component manages stacks of screens. Under the hood this is using `react-native-screens` to handle pushing and popping screens natively. Screens can be pushed and popped via the global `navigation.pushScreen` and `navigation.popScreen` methods.

```tsx
import * as React from "react";
import { View, Text, Button } from "react-native";

import { StackNavigator, Stack, navigation } from "@rn-toolkit/navigation";

function App() {
  return <StackNavigator rootScreen={<MyScreen title="Root Screen" />} />;
}

function MyScreen({
  title,
  showPopButton = false,
}: {
  title: string;
  showPopButton?: boolean;
}) {
  function pushScreen() {
    navigation.pushScreen(
      <Stack.Screen>
        <MyScreen title="Pushed screen" showPopButton />
      </Stack.Screen>
    );
  }

  function popScreen() {
    navigation.popScreen();
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{title}</Text>
      <Button title="Push screen" onPress={pushScreen} />
      {showPopButton && <Button title="Pop screen" onPress={popScreen} />}
    </View>
  );
}
```

**Note**: Any screen pushed must be wrapped in a `Stack.Screen` component. You can provide your own wrapper to the push method to simplify your usage:

```tsx
function myAppsPushScreen(
  element: React.ReactElement<unknown>,
  options?: PushScreenOptions
) {
  navigation.pushScreen(<Stack.Screen>{element}</Stack.Screen>, options);
}
```

### Tab Navigator

The `TabNavigator` component manages tabbed screens. This component is also using `react-native-screens` to handle the tab switching natively. The active tab can be changed via the `navigation.setTabIndex` method, however the tabbar that is rendered is already configured to switch tabs out of the box with no additional configuration.

```tsx
import * as React from "react";
import { View, Text, Button } from "react-native";
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
      tabbarPosition="bottom"
      screens={[
        {
          key: "1",
          screen: <MyScreen title="Screen 1" bg="red" />,
          tab: ({ isActive }) => <MyTab isActive={isActive}>1</MyTab>,
        },
        {
          key: "2",
          screen: <MyScreen title="Screen 2" bg="blue" />,
          tab: ({ isActive }) => <MyTab isActive={isActive}>2</MyTab>,
        },
        {
          key: "3",
          screen: <MyScreen title="Screen 3" bg="purple" />,
          tab: ({ isActive }) => <MyTab isActive={isActive}>3</MyTab>,
        },
      ]}
    />
  );
}

function MyTab({
  children,
  isActive,
}: {
  children: React.ReactNode;
  isActive: boolean;
}) {
  return (
    <View style={{ padding: 16, alignItems: "center" }}>
      <Text
        style={isActive ? { fontWeight: "bold" } : { fontWeight: "normal" }}
      >
        {children}
      </Text>
    </View>
  );
}

function MyScreen({
  title,
  showPopButton = false,
  bg,
}: {
  title: string;
  showPopButton?: boolean;
  bg?: string;
}) {
  function pushScreen() {
    navigation.pushScreen(
      <Stack.Screen>
        <MyScreen title="Pushed screen" showPopButton />
      </Stack.Screen>
    );
  }

  function popScreen() {
    navigation.popScreen();
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: bg || "white",
      }}
    >
      <Text>{title}</Text>
      <Button title="Push screen" onPress={pushScreen} />
      {showPopButton && <Button title="Pop screen" onPress={popScreen} />}
    </View>
  );
}
```

### Rendering a stack inside of a tabbed screen

The previous example pushes screens on top of the tab navigator, but what if you wanted each tab to have its own stack. We can achieve this by nesting `StackNavigator` components in each tab.

```tsx
function MyTabs() {
  return (
    <TabNavigator
      screens={[
        {
          key: "1",
          // Wrap the screen in a StackNavigator:
          screen: (
            <StackNavigator
              rootScreen={<MyScreen title="Screen 1" bg="red" />}
            />
          ),
          tab: ({ isActive }) => <MyTab isActive={isActive}>1</MyTab>,
        },
        // ...other screens
      ]}
    />
  );
}
```

### Targeting a specific stack

If you want to push to a specific stack in your app, you can give it an `id` prop and pass this as an option when pushing the screen.

```tsx
const MAIN_STACK_ID = "mainStack";

function App() {
  return (
    <StackNavigator
      id={MAIN_STACK_ID}
      rootScreen={<MyScreen title="Root Screen" />}
    />
  );
}

function pushToMainStack(
  screenElement: React.ReactElement<unknown>,
  options: PushScreenOptions
) {
  navigation.pushScreen(<Stack.Screen>{screenElement}</Stack.Screen>, {
    stackId: MAIN_STACK_ID,
    ...options,
  });
}
```

### Pushing a screen once

One tradeoff with imperative methods like `navigation.pushScreen` is that you can push the same screen multiple times. In cases where your UI might do this, you can provide a `key` option to only push the screen once. Screen keys are unique across all stacks.

```tsx
function pushThisScreenOnce() {
  navigation.pushScreen(
    <Stack.Screen>
      <MyScreen title="Pushed screen" />
    </Stack.Screen>,
    {
      // This screen will only be pushed once
      key: "unique-key",
    }
  );
}
```

### Targeting specific tabs

Similar to `StackNavigator`, passing an `id` prop to a `TabNavigator` will allow you to target it and set the active tab.

```tsx
const MAIN_TAB_ID = "mainTabs";

function App() {
  return <TabNavigator id={MAIN_TAB_ID} screens={tabs} />;
}

function switchMainTabsToTab(tabIndex: number) {
  navigation.setTabIndex(tabIndex, { tabId: MAIN_TAB_ID });
}
```

## Advanced Usage

`Stack` and `Tabs` are the base components of this library - they can be used to implement more complex navigation flows when needed. The navigator components in the previous examples are thin wrappers around these components - you can build your own wrappers on top of these to suite your needs too.

### Authentication

For this basic example, we want to show the login screen when the user is not logged in, otherwise we want to show our normal app. You can use the `Stack` component to conditionally render screens based on the user's state. 


```tsx
import * as React from "react";
import { Stack } from "@rn-toolkit/navigation";

function App() {
  const [user, setUser] = React.useState(null);

  return (
    <Stack.Root>
      <Stack.Screens>
        <Stack.Screen>
          <MyLoginScreen onLoginSuccess={(user) => setUser(user)} />
        </Stack.Screen>

        {user != null && (
          <UserContext.Provider value={user}>
            <Stack.Screen gestureEnabled={false}>
              <MyAuthenticatedApp />
            </Stack.Screen>
            <Stack.Slot />
          </UserContext.Provider>
        )}
      </Stack.Screens>
    </Stack.Root>
  );
}

const UserContext = React.createContext<User | null>(null);

const useUser = () => {
  const user = React.useContext(UserContext);

  if (user == null) {
    throw new Error("User not found");
  }

  return user;
};
```

**Note:** Screens that are pushed onto the stack with `pushScreen` are rendered in the `Slot` component, which you can conditionally render as well.