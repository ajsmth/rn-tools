# @rn-toolkit/navigation

A set of useful navigation components for React Native. Built with `react-native-screens`. Designed with flexibility in mind. Create your own abstractions on top of this!

## Installation

```bash
yarn expo install @rn-toolkit/navigation react-native-screens
```

## Basic Usage

For basic usage, the exported `StackNavigator` and `TabNavigator` components will get you up and running quickly. The [Advanced Usage](#advanced-usage) section covers how to use the lower-level `Stack` and `Tabs` components to handle more advanced navigation patterns.

### Stack Navigator

The `StackNavigator` component manages stacks of screens. Under the hood this is using `react-native-screens` to handle pushing and popping natively.

Screens are pushed and popped via the global `navigation.pushScreen` and `navigation.popScreen` methods.

```tsx
import { StackNavigator, Stack, navigation } from "@rn-toolkit/navigation";
import * as React from "react";
import { View, Text, Button } from "react-native";

export function BasicStack() {
  return <Stack.Navigator rootScreen={<MyScreen title="Root Screen" />} />;
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

**Note**: The element given to `pushScreen` needs to be wrapped in a `Stack.Screen` component. Create a wrapper to simplify your usage if you'd like:

```tsx
function myPushScreen(
  element: React.ReactElement<unknown>,
  options?: PushScreenOptions
) {
  navigation.pushScreen(<Stack.Screen>{element}</Stack.Screen>, options);
}
```

### Tab Navigator

The `TabNavigator` component also uses `react-native-screens` to handle the tab switching natively. The active tab can be changed via the `navigation.setTabIndex` method, however the tabs that are rendered already handle tabbing between screens without additional configuration.

```tsx
import {
  StackNavigator,
  TabNavigator,
  navigation,
  Stack,
  defaultTabbarStyle,
} from "@rn-toolkit/navigation";
import * as React from "react";
import { View, Text, Button } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function BasicTabs() {
  return <Stack.Navigator rootScreen={<MyTabs />} />;
}

function MyTabs() {
  // This hook requires you to wrap your app in a SafeAreaProvider component - see the `react-native-safe-area-context` package
  let insets = useSafeAreaInsets();

  let tabbarStyle = React.useMemo(() => {
    return {
      ...defaultTabbarStyle,
      bottom: insets.bottom,
    };
  }, [insets.bottom]);

  return (
    <Tabs.Navigator
      tabbarPosition="bottom"
      tabbarStyle={tabbarStyle}
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

Each tab can have its own stack by nesting the `StackNavigator` component

```tsx
function MyTabs() {
  return (
    <Tabs.Navigator
      screens={[
        {
          key: "1",
          // Wrap the screen in a StackNavigator:
          screen: (
            <Stack.Navigator
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

Provide an `id` prop to a stack and target it explicitly when pushing the screen.

```tsx
let MAIN_STACK_ID = "mainStack";

function App() {
  return (
    <Stack.Navigator
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
    ...options,
    stackId: MAIN_STACK_ID,
  });
}
```

### Pushing a screen once

One tradeoff with imperative methods like `navigation.pushScreen` is that it's possible to push the same screen multiple times. In cases where your UI might do this, you can provide a `screenId` option to only push the screen once. Screen ids are unique across all stacks.

**Note:** Usually when a screen is pushed multiple times it means that the screen should be rendered declaratively rather than pushed with the `pushScreen` method. This is covered in the Advanced section below.

```tsx
function pushThisScreenOnce() {
  navigation.pushScreen(
    <Stack.Screen>
      <MyScreen title="Pushed screen" />
    </Stack.Screen>,
    {
      // This screen will only be pushed once
      screenId: "unique-key",
    }
  );
}
```

### Targeting specific tabs

Similar to `StackNavigator`, pass an `id` prop to a `TabNavigator` and target a navigator expliclity when setting the active tab.

```tsx
let MAIN_TAB_ID = "mainTabs";

function App() {
  return <Tabs.Navigator id={MAIN_TAB_ID} screens={tabs} />;
}

function switchMainTabsToTab(tabIndex: number) {
  navigation.setTabIndex(tabIndex, { tabId: MAIN_TAB_ID });
}
```

## Components

The components in the previous examples are thin wrappers around the `Stack` and `Tabs` components exported by this library. Build your own wrappers on top of these base components if you need more control over how your screens are rendering.

For reference, this is the full implementation of the `StackNavigator` component:

```tsx
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
```

Likewise here is the full implementation of the `TabNavigator` component:

```tsx
type TabNavigatorProps = Omit<TabsRootProps, "children"> & {
  screens: TabNavigatorScreenOptions[];
  tabbarPosition?: "top" | "bottom";
  tabbarStyle?: ViewProps["style"];
};

type TabNavigatorScreenOptions = {
  key: string;
  screen: React.ReactElement<unknown>;
  tab: (props: { isActive: boolean; onPress: () => void }) => React.ReactNode;
};

export function TabNavigator({
  screens,
  tabbarPosition = "bottom",
  tabbarStyle,
  ...rootProps
}: TabNavigatorProps) {
  return (
    <Tabs.Root {...rootProps}>
      {tabbarPosition === "top" && (
        <Tabs.Tabbar style={tabbarStyle}>
          {screens.map((screen) => {
            return <Tabs.Tab key={screen.key}>{screen.tab}</Tabs.Tab>;
          })}
        </Tabs.Tabbar>
      )}

      <Tabs.Screens>
        {screens.map((screen) => {
          return <Tabs.Screen key={screen.key}>{screen.screen}</Tabs.Screen>;
        })}
      </Tabs.Screens>

      {tabbarPosition === "bottom" && (
        <Tabs.Tabbar style={tabbarStyle}>
          {screens.map((screen) => {
            return <Tabs.Tab key={screen.key}>{screen.tab}</Tabs.Tab>;
          })}
        </Tabs.Tabbar>
      )}
    </Tabs.Root>
  );
}
```

Hopefully this gives you an idea of how you might create your own components using `Stack` and `Tabs` without too much effort

## Advanced Usage

### Authentication

For this example, we want to show our main app when the user is logged in, otherwise show the login screen. You can use the `Stack` component to conditionally render screens based on the user's state.

```tsx
import * as React from "react";
import { Stack } from "@rn-toolkit/navigation";

function App() {
  let [user, setUser] = React.useState(null);

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

let UserContext = React.createContext<User | null>(null);

let useUser = () => {
  let user = React.useContext(UserContext);

  if (user == null) {
    throw new Error("User not found");
  }

  return user;
};
```

**Note:** Screens that are pushed using `pushScreen` are rendered in the `Slot` component

### Deep linking

### Header components

You can use the `Stack.Header` component to render a header for your screens, so long as you pass it as the first child to your screen component. Under the hood the `Stack.Header` component is just the one exported by `react-native-screens`. It provides some convenience over rolling your own headers at times.

### Prevent going back

The `Stack.Screen` component is also exported from `react-native-screens` component. You can use the `gestureEnabled` prop to prevent the user from being able to swipe back on any screen, and the `preventNativeDismiss` prop to prevent the user from being able to dismiss the screen natively.
