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
  type TabScreen,
} from "@rn-tools/navigation";

const navigation = createNavigation();

const tabScreens: TabScreen[] = [
  {
    id: "home",
    element: <Stack rootScreen={<HomeScreen />} />,
    tab: ({ isActive }) => <Text style={{ fontWeight: isActive ? "bold" : "normal" }}>Home</Text>
  },
  {
    id: "settings",
    element: <SettingsScreen />,
    tab: ({ isActive }) => <Text style={{ fontWeight: isActive ? "bold" : "normal" }}>Settings</Text>
  },
];

export default function App() {
  return (
    <Navigation navigation={navigation}>
      <Tabs screens={tabScreens} />
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
