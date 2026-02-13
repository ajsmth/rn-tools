# Tabs

Tab navigation component built on `react-native-screens`. Renders all tab screens natively and manages active state through the navigation store.

## Basic Usage

```tsx
import { Tabs, type TabScreenOptions } from "@rn-tools/navigation";

const screens: TabScreenOptions[] = [
  {
    id: "home",
    screen: <HomeScreen />,
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

function App() {
  return <Tabs id="main-tabs" screens={screens} />;
}
```

## Props

### `TabsProps`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | — | Identifier for this tabs instance in the navigation store. |
| `active` | `boolean` | `true` | Whether the tabs container is considered active in the render tree. |
| `screens` | `TabScreenOptions[]` | — | Array of tab screen configurations. |
| `tabbarPosition` | `"top" \| "bottom"` | `"bottom"` | Where the tab bar is rendered relative to the screen content. |
| `tabbarStyle` | `ViewStyle` | — | Additional styles applied to the tab bar container. |

## Types

### `TabScreenOptions`

Configuration for a single tab screen.

```ts
type TabScreenOptions = {
  id: string;
  screen: React.ReactElement;
  tab: (props: {
    id: string;
    isActive: boolean;
    onPress: () => void;
  }) => React.ReactElement;
};
```

| Field | Description |
|-------|-------------|
| `id` | Unique identifier for the tab screen. |
| `screen` | The content rendered when this tab is displayed. |
| `tab` | Render function for the tab bar item. Receives `id`, `isActive`, and an `onPress` handler to switch to this tab. |

### `TabsHandle`

Ref handle exposed by the `Tabs` component.

```ts
type TabsHandle = {
  setActive: (index: number) => void;
};
```

| Method | Description |
|--------|-------------|
| `setActive(index)` | Imperatively switch to the tab at the given index. |

## Ref Usage

Use a ref to switch tabs imperatively without going through the navigation store directly:

```tsx
import { useRef } from "react";
import { Tabs, type TabsHandle } from "@rn-tools/navigation";

function App() {
  const tabsRef = useRef<TabsHandle>(null);

  return (
    <>
      <Tabs ref={tabsRef} id="main-tabs" screens={screens} />
      <Button
        title="Go to Settings"
        onPress={() => tabsRef.current?.setActive(1)}
      />
    </>
  );
}
```

## Preloading Active Tab

Set the initial active tab through the navigation state when creating the navigation instance:

```tsx
const navigation = createNavigation({
  tabs: {
    "main-tabs": { activeIndex: 1 },
  },
});
```

## Tab Bar Position

Render the tab bar above the screen content:

```tsx
<Tabs id="main-tabs" screens={screens} tabbarPosition="top" />
```

## Nesting with Stacks

Each tab can contain its own `Stack` for independent navigation hierarchies:

```tsx
const screens: TabScreenOptions[] = [
  {
    id: "home",
    screen: <Stack id="home-stack" rootScreen={<HomeScreen />} />,
    tab: ({ isActive, onPress }) => (
      <Pressable onPress={onPress}>
        <Text>Home</Text>
      </Pressable>
    ),
  },
  {
    id: "profile",
    screen: <Stack id="profile-stack" rootScreen={<ProfileScreen />} />,
    tab: ({ isActive, onPress }) => (
      <Pressable onPress={onPress}>
        <Text>Profile</Text>
      </Pressable>
    ),
  },
];
```

When pushing screens via `navigation.push()`, the navigation system automatically targets the stack inside the currently active tab.
