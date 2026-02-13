# @rn-tools/navigation

Navigation primitives for React Native. Built on `react-native-screens`.

## Installation

```bash
yarn expo install @rn-tools/navigation react-native-screens
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

Push and pop screens imperatively:

```tsx
navigation.push(<DetailScreen />, { id: "detail" });
navigation.pop();
navigation.tab(1);
navigation.present(<EditSheet />, { id: "edit", snapPoints: [320, 520] });
navigation.dismiss();
navigation.dismissAll();
```

When no explicit target is provided, these methods automatically resolve the deepest active stack or tabs instance.

## Docs

- [Navigation](docs/navigation.md) — setup, `createNavigation`, `NavigationClient` API, hooks
- [Stack](docs/stack.md) — stack navigation, pushing/popping, refs, preloading, nesting
- [Tabs](docs/tabs.md) — tab navigation, tab bar, refs, preloading, nesting with stacks
