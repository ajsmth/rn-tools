# @rn-tools/navigation

Navigation primitives for React Native. Built on `react-native-screens` with integrated sheets and notifications support.

## Installation

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

## Quick Start

```tsx
import {
  createNavigation,
  Navigation,
  Stack,
  Tabs,
  type TabScreenOptions,
} from "@rn-tools/navigation";

const navigation = createNavigation();

const tabScreens: TabScreenOptions[] = [
  {
    id: "home",
    screen: <Stack id="home" rootScreen={<HomeScreen />} />,
    tab: ({ isActive, onPress }) => (
      <Pressable onPress={onPress}>
        <Text style={{ fontWeight: isActive ? "bold" : "normal" }}>Home</Text>
      </Pressable>
    ),
  },
  {
    id: "settings",
    screen: <SettingsScreen />,
    tab: ({ isActive, onPress }) => (
      <Pressable onPress={onPress}>
        <Text style={{ fontWeight: isActive ? "bold" : "normal" }}>Settings</Text>
      </Pressable>
    ),
  },
];

export default function App() {
  return (
    <Navigation navigation={navigation}>
      <Tabs id="main-tabs" screens={tabScreens} />
    </Navigation>
  );
}
```

## Docs

You now have access to all of the following APIs in your app!

- [Navigation](docs/navigation.md)
- [Stack](docs/stack.md)
- [Tabs](docs/tabs.md)
- [Sheets](../sheets/README.md)
- [Notifications](../notifications/README.md)
