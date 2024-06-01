# @rn-tools/navigation

A set of useful navigation components for React Native. Built with `react-native-screens` and designed with flexibility in mind.

## Installation

```bash
yarn expo install @rn-tools/navigation react-native-screens
```

## Basic Usage

For basic usage, the exported `Stack.Navigator` and `Tabs.Navigator` will get you up and running quickly. The [Guides](#guides) section covers how to use lower-level `Stack` and `Tabs` components in a variety of navigation patterns.

**Note:** It's recommended that you install and wrap your app in a `SafeAreaProvider` to ensure components are rendered correctly based on the device's insets: 

`yarn expo install react-native-safe-area-context`


### Stack Navigator

The `Stack.Navigator` component manages stacks of screens. Under the hood this is using `react-native-screens` to handle pushing and popping natively.

Screens are pushed and popped by the exported navigation methods:

- `navigation.pushScreen(screenElement: React.ReactElement<ScreenProps>, options?: PushScreenOptions) => void`

- `navigation.popScreen(numberOfScreens: number) => void`

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

**Note**: The components passed to `navigation.pushScreen` need to be wrapped in a `Stack.Screen` component. Create a wrapper to simplify your usage if you'd like:

```tsx
function myPushScreen(
  element: React.ReactElement<unknown>,
  options?: PushScreenOptions
) {
  navigation.pushScreen(<Stack.Screen>{element}</Stack.Screen>, options);
}
```

### Tab Navigator

The `Tabs.Navigator` component also uses `react-native-screens` to handle the tab switching natively. The active tab can be changed via the `navigation.setTabIndex` method, however the build in tabbar already handles switching between screens.


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

- `navigation.pushScreen` will push to the relative parent stack of the screen. See the next section for how to push a screen onto a specific stack.

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

**Note:** Wrap your App in a `SafeAreaProvider` to ensure your screen components are rendered correctly with the header

**Note:**: The header component has to be the first child of the `Stack.Screen` component.

```tsx
import { navigation, Stack } from "@rn-tools/navigation";
import * as React from "react";
import { Button, View, TextInput } from "react-native";

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
      <Stack.Header
        title={title}
        // Some potentially useful props - see the reference posted above for all available props
        backTitle="Custom back title"
        backTitleFontSize={16}
        hideBackButton={false}
      />

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

The `Navigator` components in the previous examples are convenience wrappers around other lower level `Stack` and `Tabs` components. This section will briefly cover each of the underlying components so that you can build your own wrappers if needed

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

## Tabs

This is the implementation of the exported `Tabs.Navigator` component:

```tsx
type TabsNavigatorProps = Omit<TabsRootProps, "children"> & {
  screens: Tabs.NavigatorScreenOptions[];
  tabbarPosition?: "top" | "bottom";
  tabbarStyle?: ViewProps["style"];
};

type TabsNavigatorScreenOptions = {
  key: string;
  screen: React.ReactElement<ScreenProps>;
  tab: (props: { isActive: boolean; onPress: () => void }) => React.ReactNode;
};

export function Tabs.Navigator({
  screens,
  tabbarPosition = "bottom",
  tabbarStyle,
  ...rootProps
}: TabsNavigatorProps) {
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
