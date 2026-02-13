# Navigation

Root component and client for the `@rn-tools/navigation` system. The `Navigation` component provides context for all navigation primitives (`Stack`, `Tabs`), while the `NavigationClient` exposes imperative methods for pushing screens, popping screens, and switching tabs.

## Setup

Create a navigation client and wrap your app in the `Navigation` component:

```tsx
import { createNavigation, Navigation } from "@rn-tools/navigation";

const navigation = createNavigation();

export default function App() {
  return (
    <Navigation navigation={navigation}>
      {/* Stacks, Tabs, and screens go here */}
    </Navigation>
  );
}
```

`Navigation` sets up:
- A `RenderTree` to track which stacks and tabs are mounted and active.
- A root `Stack` (id `__root__`) that wraps all children.
- Context providers for the navigation store and client, accessible via `useNavigation()`.

## `createNavigation`

Creates a `NavigationClient` with an optional initial state.

```ts
const navigation = createNavigation();

// or with preloaded state
const navigation = createNavigation({
  stacks: {
    "main-stack": [
      { element: <DetailScreen />, options: { id: "detail" } },
    ],
  },
  tabs: {
    "main-tabs": { activeIndex: 1 },
  },
});
```

The `stacks` and `tabs` fields accept either plain `Record` objects (as above) or `Map` instances.

### Return value: `NavigationClient`

```ts
type NavigationClient = {
  store: NavigationStore;
  renderTreeStore: RenderTreeStore;
  push: (element: React.ReactElement, options?: PushOptions) => void;
  pop: (options?: { stack?: string }) => void;
  tab: (index: number, options?: { tabs?: string }) => void;
};
```

| Property | Description |
|----------|-------------|
| `store` | The underlying store holding `NavigationState` (stacks and tabs). |
| `renderTreeStore` | The render tree store tracking mounted navigation nodes. |
| `push` | Push a screen onto a stack. See [push](#push). |
| `pop` | Pop the top screen from a stack. See [pop](#pop). |
| `tab` | Switch the active tab. See [tab](#tab). |

## Props

### `NavigationProps`

| Prop | Type | Description |
|------|------|-------------|
| `navigation` | `NavigationClient` | The client returned by `createNavigation()`. |
| `children` | `React.ReactNode` | Your app's navigation tree (stacks, tabs, screens). |

## Methods

### `push`

```ts
navigation.push(element, options?)
```

Pushes a screen element onto a stack.

| Parameter | Type | Description |
|-----------|------|-------------|
| `element` | `React.ReactElement` | The screen content to push. |
| `options.id` | `string?` | Optional screen ID. Prevents duplicate pushes when a screen with the same ID already exists on the stack. |
| `options.stack` | `string?` | Target a specific stack. When omitted, the deepest active stack in the render tree is used. |

Throws if no `stack` is provided and no stack is currently mounted and active.

### `pop`

```ts
navigation.pop(options?)
```

Removes the top screen from a stack. No-op if the stack is empty.

| Parameter | Type | Description |
|-----------|------|-------------|
| `options.stack` | `string?` | Target a specific stack. When omitted, the deepest active stack is used. |

Throws if no `stack` is provided and no stack is currently mounted and active.

### `tab`

```ts
navigation.tab(index, options?)
```

Switches to the tab at the given index.

| Parameter | Type | Description |
|-----------|------|-------------|
| `index` | `number` | Zero-based index of the tab to activate. |
| `options.tabs` | `string?` | Target a specific tabs instance. When omitted, the deepest active tabs in the render tree is used. |

Throws if no `tabs` is provided and no tabs instance is currently mounted and active.

## Automatic Target Resolution

When `push`, `pop`, or `tab` are called without an explicit target ID, the navigation system walks the render tree to find the **deepest active** node of the matching type (`stack` or `tabs`).

This means:
- If tabs contain stacks, `push()` targets the stack inside the active tab.
- If a parent stack becomes inactive, operations fall back to the next deepest active stack.
- Nested stacks/tabs are handled automatically without needing to pass IDs.

## `createNavigationState`

Creates a normalized `NavigationState` from a plain input. Useful for preparing state outside of the client:

```ts
import { createNavigationState } from "@rn-tools/navigation";

const state = createNavigationState({
  stacks: { "main-stack": [] },
  tabs: { "main-tabs": { activeIndex: 0 } },
});
```

## `loadNavigationState`

Replaces the state in an existing navigation store. Useful for restoring persisted state:

```ts
import { createNavigation, loadNavigationState } from "@rn-tools/navigation";

const navigation = createNavigation();

loadNavigationState(navigation.store, {
  stacks: {
    "main-stack": [
      { element: <DetailScreen />, options: { id: "detail" } },
    ],
  },
});
```

## Hooks

### `useNavigation`

Returns the `NavigationClient` from context. Must be called within a `Navigation` tree.

```tsx
import { useNavigation } from "@rn-tools/navigation";

function MyScreen() {
  const navigation = useNavigation();

  return (
    <Button
      title="Push"
      onPress={() => navigation.push(<NextScreen />)}
    />
  );
}
```

## Full Example

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
    tab: ({ id, isActive, onPress }) => (
      <Pressable onPress={onPress}>
        <Text style={{ fontWeight: isActive ? "bold" : "normal" }}>Home</Text>
      </Pressable>
    ),
  },
  {
    id: "settings",
    screen: <SettingsScreen />,
    tab: ({ id, isActive, onPress }) => (
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
