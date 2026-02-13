# @rn-tools/navigation

Navigation primitives for React Native. Built on `react-native-screens` with integrated sheets support.

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

Navigate screens and present sheets imperatively:

```tsx
navigation.push(<DetailScreen />, { id: "detail" });
navigation.pop();
navigation.tab(1);
navigation.present(<EditSheet />, { id: "edit", snapPoints: [320, 520] });
navigation.dismiss();
navigation.dismissAll();
```

When no explicit target is provided:
- `push/pop/tab` resolve the deepest active stack/tabs node.
- `dismiss()` resolves the active sheet.

## Docs

- [Navigation](docs/navigation.md) — setup, `createNavigation`, `NavigationClient` API (screens + sheets), hooks
- [Stack](docs/stack.md) — stack navigation, pushing/popping, refs, preloading, nesting
- [Tabs](docs/tabs.md) — tab navigation, tab bar, refs, preloading, nesting with stacks
- [Sheets](../sheets/README.md) — sheet setup, API, and props
