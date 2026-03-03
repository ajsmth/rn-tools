# Navigation

Root component and client for the `@rn-tools/navigation` system.

`Navigation` provides context for `Stack` and `Tabs`, and also mounts sheets + notifications support internally so you can present both from the navigation client.

## Setup

Create a navigation client and wrap your app:

```tsx
import { createNavigation, Navigation } from "@rn-tools/navigation";

const navigation = createNavigation();

export default function App() {
  return (
    <Navigation navigation={navigation}>
      {/* Stacks, Tabs, screens */}
    </Navigation>
  );
}
```

`Navigation` sets up:
- a render tree for active stack/tab resolution
- a root `Stack` (`__root__`)
- navigation context/providers
- a sheets provider (for `navigation.sheets.present(...)`)
- a notifications provider (for `navigation.notifications.present(...)`)

## `createNavigation`

```ts
const navigation = createNavigation();
```

`createNavigation` also accepts preloaded `stacks` and `tabs` state.

## `NavigationClient`

```ts
type NavigationClient = {
  store: NavigationStore;
  renderTreeStore: RenderTreeStore;
  sheetsStore: SheetsClient;
  notificationsStore: NotificationsClient;

  stack: {
    push: (element: React.ReactElement, options?: PushOptions) => void;
    pop: (options?: { stack?: string }) => void;
  };
  tabs: {
    tab: (index: number, options?: { tabs?: string }) => void;
  };
  sheets: {
    present: (element: React.ReactElement, options?: SheetOptions) => string;
    dismiss: (id?: string) => void;
    dismissAll: () => void;
  };
  notifications: {
    present: (
      element: React.ReactElement,
      options?: NotificationOptions,
    ) => string;
    dismiss: (target?: NotificationDismissTarget) => void;
  };
};
```

## Screen methods

### `push`

```ts
navigation.stack.push(element, options?)
```

Pushes to a stack.

- `options.stack?`: target stack id; otherwise deepest active stack is used.
- `options.id?`: optional logical id to dedupe pushes on the same stack.

### `pop`

```ts
navigation.stack.pop(options?)
```

Pops top screen from target stack (or deepest active stack).

### `tab`

```ts
navigation.tabs.tab(index, options?)
```

Switches active tab index.

- `options.tabs?`: target tabs id; otherwise deepest active tabs is used.

## Sheet methods

### `present`

```ts
navigation.sheets.present(element, options?)
```

Presents a bottom sheet and returns a sheet key.

`options` is the same `SheetOptions` used by `@rn-tools/sheets`:
- `id?`
- `snapPoints?`
- `initialIndex?`
- `canDismiss?`
- `onDismissPrevented?`
- `onStateChange?`
- `containerStyle?`
- `appearanceAndroid?`
- `appearanceIOS?`

The rendered element also receives an injected optional `dismiss?: () => void` prop.

### `dismiss`

```ts
navigation.sheets.dismiss(id?)
```

Dismisses by sheet id/key, or dismisses the top-most sheet if omitted.

### `dismissAll`

```ts
navigation.sheets.dismissAll()
```

Dismisses all active sheets.

## Notification methods

### `present`

```ts
navigation.notifications.present(element, options?)
```

Shows a notification and returns its key.

`options` is the same `NotificationOptions` used by `@rn-tools/notifications`:
- `id?`
- `position?` (`"top"` | `"bottom"`)
- `durationMs?` (`3000` by default, `null` for persistent)

The rendered element also receives an injected optional `dismiss?: () => void` prop.

### `dismiss`

```ts
navigation.notifications.dismiss(target?)
```

Dismisses a notification by key/id, lane (`"top"` or `"bottom"`), or the latest top-lane notification when omitted.

## Re-exported hooks

`@rn-tools/navigation` re-exports:
- `useSheetEntry`
- `useNotificationEntry`
- `SheetInjectedProps`
- `NotificationInjectedProps`

## Example

```tsx
import * as React from "react";
import { Button, Text, View } from "react-native";
import { createNavigation, Navigation, Stack } from "@rn-tools/navigation";

const navigation = createNavigation();

export default function App() {
  return (
    <Navigation navigation={navigation}>
      <Stack rootScreen={<Home />} />
    </Navigation>
  );
}

function Home() {
  return (
    <View>
      <Button
        title="Push"
        onPress={() => navigation.stack.push(<Detail />, { id: "detail" })}
      />
      <Button
        title="Present sheet"
        onPress={() =>
          navigation.sheets.present(
            <View style={{ padding: 24 }}>
              <Text>Sheet content</Text>
            </View>,
            { id: "edit", snapPoints: [320, 520] },
          )
        }
      />
      <Button title="Dismiss sheet" onPress={() => navigation.sheets.dismiss()} />
    </View>
  );
}

function Detail() {
  return (
    <View>
      <Button title="Back" onPress={() => navigation.stack.pop()} />
    </View>
  );
}
```
