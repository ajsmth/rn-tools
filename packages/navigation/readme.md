# @rn-tools/navigation

Navigation primitives for React Native. Built on `react-native-screens` with integrated sheets and notifications support.

## Setup

```bash
yarn expo install @rn-tools/navigation react-native-screens expo-build-properties
```

Set iOS deployment target to `16.0` in `app.json`:

```json
{
  "plugins": [
    [
      "expo-build-properties",
      {
        "ios": {
          "deploymentTarget": "16.0"
        }
      }
    ]
  ]
}
```

Create one navigation client and wrap your app with `Navigation`. That sets up stack navigation, tabs, sheets, and notifications from the same shared instance.

## Quick Start

```tsx
import {
  createNavigation,
  Navigation,
  Sheet,
  Stack,
  Tabs,
  type TabScreen,
} from "@rn-tools/navigation";
import { Button, Text, View } from "react-native";

const navigation = createNavigation();

const tabScreens: TabScreen[] = [
  {
    id: "home",
    element: <Stack rootScreen={<HomeScreen />} />,
    tab: ({ isActive }) => (
      <Text style={{ fontWeight: isActive ? "bold" : "normal" }}>Home</Text>
    ),
  },
  {
    id: "settings",
    element: <SettingsScreen />,
    tab: ({ isActive }) => (
      <Text style={{ fontWeight: isActive ? "bold" : "normal" }}>
        Settings
      </Text>
    ),
  },
];

export default function App() {
  return (
    <Navigation navigation={navigation}>
      <Tabs screens={tabScreens} />
      <Sheet id="settings-sheet" snapPoints={[320, 520]}>
        <View style={{ padding: 24 }}>
          <Text>Declarative sheet content</Text>
        </View>
      </Sheet>
    </Navigation>
  );
}

function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 12 }}>
      <Button
        title="Push details"
        onPress={() =>
          navigation.stack.push(<DetailsScreen />, { id: "details" })
        }
      />
      <Button
        title="Open sheet"
        onPress={() => navigation.sheets.open("settings-sheet")}
      />
      <Button
        title="Present sheet"
        onPress={() =>
          navigation.sheets.present(
            <View style={{ padding: 24 }}>
              <Text>Sheet content</Text>
            </View>,
            { id: "composer", snapPoints: [320, 520] },
          )
        }
      />
      <Button
        title="Show notification"
        onPress={() =>
          navigation.notifications.present(
            <View
              style={{
                marginHorizontal: 12,
                padding: 12,
                borderRadius: 12,
                backgroundColor: "#111827",
              }}
            >
              <Text style={{ color: "white" }}>Saved successfully</Text>
            </View>,
            { position: "top", durationMs: 3000 },
          )
        }
      />
    </View>
  );
}

function DetailsScreen() {
  return <Button title="Back" onPress={() => navigation.stack.pop()} />;
}

function SettingsScreen() {
  return <View style={{ flex: 1 }} />;
}
```

## What You Can Configure

### Stack screens

Use `Stack` for push/pop navigation flows:

- `rootScreen`: initial screen for that stack.
- `id`: lets you target a specific stack from `navigation.stack.push(..., { stackId })`.
- `navigation.stack.push(element, options)`: accepts `id` for deduping and `stackId` to push into a specific stack.
- `navigation.stack.pop(amount?, options)`: pops the active stack by default, or a specific one with `stackId`.

### Tabs

Use `Tabs` when each tab should keep its own screen tree alive:

- `screens`: array of `{ id, element, tab }`.
- `tabbarPosition`: `"top"` or `"bottom"`.
- `tabbarContainerStyle`: styles the whole tab bar.
- `tabbarItemStyle`: styles each pressable tab item.

Each tab can render a plain screen or its own nested `Stack`.

### Sheets

`Navigation` mounts the sheets package for you, so you can call:

- `import { Sheet } from "@rn-tools/navigation"` for declarative sheets that stay in the tree
- `navigation.sheets.present(element, options)`
- `navigation.sheets.open(id)`
- `navigation.sheets.dismiss(id?)`
- `navigation.sheets.dismissAll()`

Common sheet options:
- `id`
- `snapPoints`
- `initialIndex`
- `containerStyle`
- `appearanceIOS`
- `appearanceAndroid`

Declarative `<Sheet />` also supports:
- `canDismiss`
- `onDismissPrevented`
- `onStateChange`
- `setIsOpen`
- `onDismissed`

Declarative example:

```tsx
<Navigation navigation={navigation}>
  <Stack rootScreen={<HomeScreen />} />
  <Sheet id="settings" snapPoints={[320, 520]}>
    <SettingsSheet />
  </Sheet>
</Navigation>

<Button title="Open settings" onPress={() => navigation.sheets.open("settings")} />
```

### Notifications

`Navigation` also mounts notifications automatically:

- `navigation.notifications.present(element, options)`
- `navigation.notifications.dismiss(id?)`
- `navigation.notifications.dismissAll()`

Common notification options:
- `id`
- `position`: `"top"` or `"bottom"`
- `durationMs`: use `null` for persistent notifications
- `onPress`

## Simple Patterns

- Start with `<Navigation><Stack rootScreen={...} /></Navigation>` if you only need push/pop navigation.
- Wrap stacks inside `Tabs` when each tab should manage its own navigation history.
- Use `navigation.sheets.present(...)` for transient tasks like editors, pickers, and confirmation flows.
- Use `navigation.notifications.present(...)` for lightweight status feedback without wiring a separate provider.

## Docs

The package-level README is intentionally short. Use the docs below for API detail:

- [Navigation](docs/navigation.md)
- [Stack](docs/stack.md)
- [Tabs](docs/tabs.md)
- [Sheets](../sheets/README.md)
- [Notifications](../notifications/README.md)
