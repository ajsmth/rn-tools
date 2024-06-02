# @rn-tools/navigation

A set of useful navigation components for React Native. Built with `react-native-screens` and designed with flexibility in mind.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
  - [Stack Navigator](#stack-navigator)
  - [Tab Navigator](#tab-navigator)
  - [Rendering a stack inside of a tabbed screen](#rendering-a-stack-inside-of-a-tabbed-screen)
  - [Targeting a specific stack](#targeting-a-specific-stack)
  - [Pushing a screen once](#pushing-a-screen-once)
  - [Targeting specific tabs](#targeting-specific-tabs)
  - [Rendering a header](#rendering-a-header)
- [Components](#components)
  - [Stack](#stack)
  - [Tabs](#tabs)
- [Guides](#guides)
  - [Authentication](#authentication)
  - [Deep Links](#deep-links)
  - [Preventing going back](#preventing-going-back)

## Installation

```bash
yarn expo install @rn-tools/navigation react-native-screens
```

**Note:** It's recommended that you install and wrap your app in a `SafeAreaProvider` to ensure components are rendered correctly based on the device's insets:

```bash
yarn expo install react-native-safe-area-context
```

## Basic Usage

For basic usage, the exported `Stack.Navigator` and `Tabs.Navigator` will get you up and running quickly.

The [Guides](#guides) section covers how to use lower-level `Stack` and `Tabs` components in a variety of navigation patterns.

`Stack` and `Tabs` are composable components that can be safely nested within each other without any additional configuration or setup.

### Stack Navigator

The `Stack.Navigator` component manages screens. Under the hood this is using `react-native-screens` to handle pushing and popping natively.

Screens are pushed and popped by the exported navigation methods:

- `navigation.pushScreen(screenElement: React.ReactElement<ScreenProps>, options?: PushScreenOptions) => void`

- `navigation.popScreen(numberOfScreens: number) => void`

In the majority of cases, these methods will determine the right stack without you needing to specify. But you can target a specific stacks as well if you need to! This is covered in the [Targeting a specific stack](#targeting-a-specific-stack) section.

```tsx
import { Stack, navigation } from "@rn-tools/navigation";
import * as React from "react";
import { View, Text, Button } from "react-native";

export function BasicStack() {
  return <Stack.Navigator rootScreen={<MyScreen title="Root Screen" />} />;
}

function MyScreen({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  function pushScreen() {
    navigation.pushScreen(
      <Stack.Screen>
        <MyScreen title="Pushed screen">
          <Button title="Pop screen" onPress={popScreen} />
        </MyScreen>
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
      {children}
    </View>
  );
}
```

**Note**: The components passed to `navigation.pushScreen` need to be wrapped in a `Stack.Screen`. Create a wrapper to simplify your usage if you'd like:

```tsx
function myPushScreen(
  element: React.ReactElement<unknown>,
  options?: PushScreenOptions
) {
  navigation.pushScreen(<Stack.Screen>{element}</Stack.Screen>, options);
}
```

### Tab Navigator

The `Tabs.Navigator` component also uses `react-native-screens` to handle switching between tabs natively.

The active tab can be changed via the `navigation.setTabIndex` method, however the built in tabbar handles switching between screens out of the box.

```tsx
import { Tabs, navigation, Stack } from "@rn-tools/navigation";
import * as React from "react";
import { View, Text, Button } from "react-native";

// It's recommended to wrap your App in a SafeAreaProvider once
import { SafeAreaProvider } from "react-native-safe-area-context";

export function BasicTabs() {
  return (
    <SafeAreaProvider>
      <Stack.Navigator rootScreen={<MyTabs />} />
    </SafeAreaProvider>
  );
}

function MyTabs() {
  return (
    <Tabs.Navigator
      tabbarPosition="bottom"
      tabbarStyle={{ backgroundColor: "blue" }}
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
  children,
  bg,
}: {
  title: string;
  children?: React.ReactNode;
  bg?: string;
}) {
  function pushScreen() {
    navigation.pushScreen(
      <Stack.Screen>
        <MyScreen title="Pushed screen" bg={bg}>
          <Button title="Pop screen" onPress={popScreen} />
        </MyScreen>
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
      {children}
    </View>
  );
}
```

### Rendering a stack inside of a tabbed screen

Each tab can have its own stack by nesting the `Stack.Navigator` component.

```tsx
function MyTabs() {
  return (
    <Tabs.Navigator
      screens={[
        {
          key: "1",
          // Wrap the screen in a Stack.Navigator:
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

Provide an `id` prop to a stack and target when pushing the screen.

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

Provide a `screenId` option to only push the screen once. Screen ids are unique across all stacks.

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

Similar to `Stack.Navigator`, pass an `id` prop to a `Tabs.Navigator` and target a navigator expliclity when setting the active tab.

```tsx
let MAIN_TAB_ID = "mainTabs";

function App() {
  return <Tabs.Navigator id={MAIN_TAB_ID} screens={tabs} />;
}

function switchMainTabsToTab(tabIndex: number) {
  navigation.setTabIndex(tabIndex, { tabId: MAIN_TAB_ID });
}
```

### Rendering a header

Use the `Stack.Header` component to render a native header in a screen.

Under the hood this is using `react-native-screens` header - [here is a reference for the available props](https://github.com/software-mansion/react-native-screens/blob/main/guides/GUIDE_FOR_LIBRARY_AUTHORS.md#screenstackheaderconfig)

You can provide custom left, center, and right views in the header by using the `Stack.HeaderLeft`, `Stack.HeaderCenter`, and `Stack.HeaderRight` view container components as children of `Stack.Header`.

**Note:** Wrap your App in a `SafeAreaProvider` to ensure your screen components are rendered correctly with the header

**Note:**: The header component **has to be the first child** of a `Stack.Screen` component.

```tsx
import { navigation, Stack } from "@rn-tools/navigation";
import * as React from "react";
import { Button, View, TextInput, Text } from "react-native";

export function HeaderExample() {
  return (
    <View>
      <Button
        title="Push screen with header"
        onPress={() => navigation.pushScreen(<MyScreenWithHeader />)}
      />
    </View>
  );
}

function MyScreenWithHeader() {
  let [title, setTitle] = React.useState("");

  return (
    <Stack.Screen>
      {/* Header must be the first child */}
      <Stack.Header
        title={title}
        // Some potentially useful props - see the reference posted above for all available props
        backTitle="Custom back title"
        backTitleFontSize={16}
        hideBackButton={false}
      >
        <Stack.HeaderRight>
          <Text>Custom right text!</Text>
        </Stack.HeaderRight>
      </Stack.Header>

      <View
        style={{
          flex: 1,
          alignItems: "center",
          paddingVertical: 48,
        }}
      >
        <TextInput
          style={{ fontSize: 26, fontWeight: "semibold" }}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter header text"
        />
      </View>
    </Stack.Screen>
  );
}
```

## Components

The `Navigator` components in the previous examples are fairly straightforward wrappers around other lower level `Stack` and `Tabs` components.

If you need to customize behaviour, design a component API you prefer to use, or just enjoy writing your own components, you can use these implementations as a reference to build your own.

### Stack

This is the implementation of the exported `Stack.Navigator` component:

```tsx
type StackNavigatorProps = Omit<StackRootProps, "children"> & {
  rootScreen: React.ReactElement<unknown>;
};

export function StackNavigator({
  rootScreen,
  ...rootProps
}: Stack.NavigatorProps) {
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

- `Stack.Root` - The root component for a stack navigator.
- `Stack.Screens` - The container for all screens in a stack.
  - This is a `react-native-screens` StackScreenContainer component under the hood.
  - All UI rendered children should be `Stack.Screen` or `Stack.Slot` components.
  - You can still render contexts and other non-UI components directly under `Stack.Screens`. See the Authentication guide for examples of this
- `Stack.Screen` - A screen in a stack.
  - This is a `react-native-screens` StackScreen component under the hood.
  - Notable props include `gestureEnabled`, `stackPresentation` and `preventNativeDismiss` to control how the screen can be interacted with.
  - Reference for props that can be passed: [Screen Props](https://github.com/software-mansion/react-native-screens/blob/main/guides/GUIDE_FOR_LIBRARY_AUTHORS.md#screen)
- `Stack.Slot` - A slot for screens to be pushed into.
  - This component is used to render screens that are pushed using `navigation.pushScreen` - don't forget to render this somewhere in `Stack.Screens`!
- `Stack.Header` - A header for a screen.
  - **Must be rendered as the first child of a `Stack.Screen` component.**
  - This is a `react-native-screens` StackHeader component under the hood.
  - Reference for props that can be passed: [Header Props](https://github.com/software-mansion/react-native-screens/blob/main/guides/GUIDE_FOR_LIBRARY_AUTHORS.md#screenstackheaderconfig)

## Tabs

This is the implementation of the exported `Tabs.Navigator` component:

```tsx
export type TabNavigatorProps = Omit<TabsRootProps, "children"> & {
  screens: TabNavigatorScreenOptions[];
  tabbarPosition?: "top" | "bottom";
  tabbarStyle?: ViewProps["style"];
};

export type TabNavigatorScreenOptions = {
  key: string;
  screen: React.ReactElement<unknown>;
  tab: (props: { isActive: boolean; onPress: () => void }) => React.ReactNode;
};

let TabNavigator = React.memo(function TabNavigator({
  screens,
  tabbarPosition = "bottom",
  tabbarStyle: tabbarStyleProp,
  ...rootProps
}: TabNavigatorProps) {
  let insets = useSafeAreaInsetsSafe();

  let tabbarStyle = React.useMemo(() => {
    return [
      defaultTabbarStyle,
      {
        paddingBottom: tabbarPosition === "bottom" ? insets.bottom : 0,
        paddingTop: tabbarPosition === "top" ? insets.top : 0,
      },
      tabbarStyleProp,
    ];
  }, [tabbarPosition, tabbarStyleProp, insets]);

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
});
```

- `Tabs.Root` - The root component for a tabs navigator.
- `Tabs.Screens` - The container for all screens in a tabs navigator.
  - This is a `react-native-screens` ScreenContainer component under the hood.
  - All UI rendered children should be `Tabs.Screen` components.
- `Tabs.Screen` - A screen in a tabs navigator.
- `Tabs.Tabbar` - The tab bar for a tabs navigator.
  - Each child Tab of the tab bar will target the screen that corresponds to its index
- `Tabs.Tab` - A tab in a tabs navigator
  - This is a Pressable component that switches the active screen

## Guides

### Authentication

For this example, we want to show our main app when the user is logged in, otherwise show the login screen. You can use the `Stack` component to conditionally render screens based on the user's state.

```tsx
import * as React from "react";
import { Stack } from "@rn-tools/navigation";

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

### Deep Links

This section will cover how to respond to deep links in your app. Deep links usually have some extra setup required - use Expo's [Deep Linking Guide](https://docs.expo.dev/guides/deep-linking/) to get started. Once you are able to receive deep links, use the `DeepLinks` component exported from this library to handle them.

In this example we will have a basic 3 tab view. We want to repond to the link `home/items/:id` by navigating to the home tab and then pushing a detail screen with the corresponding item id. The deep link component takes an array of handlers which are functions that will be invoked when their `path` matches the deep link that was opened.

- Only the first matching handler will be invoked.
- The handler function will receive the params from the deep link - these use the same token syntax as libraries like `react-router` and `express` for path params.
- Make sure that the `DeepLinks` component is inside of a `Stack` component

```tsx
import { DeepLinks, navigation, Stack, Tabs } from "@rn-tools/navigation";
import * as Linking from "expo-linking";
import * as React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export default function DeepLinksExample() {
  // You'll likely want to use Expo's Linking API to get the current URL and path
  // let url = Linking.useURL()
  // let { path } = Linking.parse(url)

  // But it's easier to test hardcoded strings for the sake of this example
  let path = "/home/item/2";

  return (
    <Stack.Navigator
      rootScreen={
        <DeepLinks
          path={path}
          handlers={[
            {
              path: "/home/item/:itemId",
              handler: (params: { itemId: string }) => {
                let itemId = params.itemId;

                // Go to home tab
                navigation.setTabIndex(0);

                // Push the screen we want
                navigation.pushScreen(
                  <Stack.Screen>
                    <MyScreen title={`Item: ${itemId}`} />
                  </Stack.Screen>
                );
              },
            },
          ]}
        >
          <MyTabs />
        </DeepLinks>
      }
    />
  );
}

function MyTabs() {
  return (
    <Tabs.Navigator
      tabbarPosition="bottom"
      screens={[
        {
          key: "1",
          screen: (
            <Stack.Navigator
              rootScreen={<MyScreen bg="red" title="Home screen" isRoot />}
            />
          ),
          tab: ({ isActive }) => <MyTab text="Home" isActive={isActive} />,
        },
        {
          key: "2",
          screen: (
            <Stack.Navigator
              rootScreen={<MyScreen bg="blue" title="Search screen" isRoot />}
            />
          ),
          tab: ({ isActive }) => <MyTab text="Search" isActive={isActive} />,
        },
        {
          key: "3",
          screen: (
            <Stack.Navigator
              rootScreen={
                <MyScreen bg="purple" title="Settings screen" isRoot />
              }
            />
          ),
          tab: ({ isActive }) => <MyTab text="Settings" isActive={isActive} />,
        },
      ]}
    />
  );
}

function MyTab({ isActive, text }: { isActive?: boolean; text: string }) {
  return (
    <View
      style={{
        padding: 16,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: isActive ? "bold" : "normal" }}>
        {text}
      </Text>
    </View>
  );
}

function MyScreen({
  bg = "white",
  title = "",
  isRoot = false,
}: {
  title?: string;
  bg?: string;
  isRoot?: boolean;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Text style={{ fontSize: 26, fontWeight: "semibold" }}>{title}</Text>

        {!isRoot && (
          <TouchableOpacity
            onPress={() => {
              navigation.popScreen();
            }}
          >
            <Text>Pop</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

```

### Preventing going back

If you want to prevent users from popping a screen and potentially losing unsaved data, you can stop the screen from being dismissed by a gesture or pressing the back button.

**Note:**: The native header component does not provide a reliable way to prevent going back on iOS, so you'll have to provide your own custom back button by using the `Stack.HeaderLeft` component

```tsx
import { navigation, Stack } from "@rn-tools/navigation";
import * as React from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  Button,
  View,
  Alert,
} from "react-native";

export function PreventGoingBack() {
  return (
    <Button
      title="Push screen"
      onPress={() => navigation.pushScreen(<MyScreen />)}
    />
  );
}

function MyScreen() {
  let [input, setInput] = React.useState("");

  let canGoBack = input.length === 0;

  let onPressBackButton = React.useCallback(() => {
    if (canGoBack) {
      navigation.popScreen();
    } else {
      Alert.alert("Are you sure you want to go back?", "", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => navigation.popScreen(),
        },
      ]);
    }
  }, [canGoBack]);

  return (
    <Stack.Screen
      preventNativeDismiss={!canGoBack}
      nativeBackButtonDismissalEnabled={!canGoBack}
      gestureEnabled={canGoBack}
    >
      <Stack.Header title="Prevent going back">
        <Stack.HeaderLeft>
          <TouchableOpacity
            onPress={onPressBackButton}
            style={{ opacity: canGoBack ? 1 : 0.4 }}
          >
            <Text>Back</Text>
          </TouchableOpacity>
        </Stack.HeaderLeft>
      </Stack.Header>
      <View style={{ paddingVertical: 48, paddingHorizontal: 16, gap: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "medium" }}>
          Enter some text and try to go back
        </Text>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Enter some text"
          onSubmitEditing={() => setInput("")}
        />
        <Button title="Submit" onPress={() => setInput("")} />
      </View>
    </Stack.Screen>
  );
}
```
