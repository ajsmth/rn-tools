# @rn-tools/navigation

Navigation primitives for React Native. Built on `react-native-screens` with integrated sheets and notifications support.

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

Navigate screens, present sheets, and trigger notifications imperatively:

```tsx
navigation.push(<DetailScreen />, { id: "detail" });
navigation.pop();
navigation.tab(1);
navigation.present(<EditSheet />, { id: "edit", snapPoints: [320, 520] });
navigation.dismiss();
navigation.dismissAll();
navigation.notify(<SavedNotification />, { id: "saved", position: "top", durationMs: 3000 });
navigation.dismissNotification();
navigation.dismissNotification("bottom");
navigation.dismissNotification("saved");
```

Presented sheet and notification elements receive an injected optional `dismiss?: () => void` prop.

When no explicit target is provided:
- `push/pop/tab` resolve the deepest active stack/tabs node.
- `dismiss()` resolves the active sheet.
- `dismissNotification()` resolves the latest non-closing top-lane notification.

Hooks are also re-exported for convenience:
- `useSheetEntry` (from `@rn-tools/sheets`)
- `useNotificationEntry` (from `@rn-tools/notifications`)

Injected-prop typings are re-exported as well:
- `SheetInjectedProps`
- `NotificationInjectedProps`

## Docs

- [Navigation](docs/navigation.md) — setup, `createNavigation`, `NavigationClient` API (screens + sheets + notifications), hooks
- [Stack](docs/stack.md) — stack navigation, pushing/popping, refs, preloading, nesting
- [Tabs](docs/tabs.md) — tab navigation, tab bar, refs, preloading, nesting with stacks
- [Sheets](../sheets/README.md) — sheet setup, API, and props
- [Notifications](../notifications/README.md) — notification setup, API, and props
