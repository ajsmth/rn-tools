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
- a sheets provider (for `navigation.present(...)`)
- a notifications provider (for `navigation.notify(...)`)

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

  push: (element: React.ReactElement, options?: PushOptions) => void;
  pop: (options?: { stack?: string }) => void;
  tab: (index: number, options?: { tabs?: string }) => void;

  present: (element: React.ReactElement, options?: SheetOptions) => string;
  dismiss: (id?: string) => void;
  dismissAll: () => void;

  notify: (
    element: React.ReactElement,
    options?: NotificationOptions,
  ) => string;
  dismissNotification: (target?: NotificationDismissTarget) => void;
};
```

## Screen methods

### `push`

```ts
navigation.push(element, options?)
```

Pushes to a stack.

- `options.stack?`: target stack id; otherwise deepest active stack is used.
- `options.id?`: optional logical id to dedupe pushes on the same stack.

### `pop`

```ts
navigation.pop(options?)
```

Pops top screen from target stack (or deepest active stack).

### `tab`

```ts
navigation.tab(index, options?)
```

Switches active tab index.

- `options.tabs?`: target tabs id; otherwise deepest active tabs is used.

## Sheet methods

### `present`

```ts
navigation.present(element, options?)
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

### `dismiss`

```ts
navigation.dismiss(id?)
```

Dismisses by sheet id/key, or dismisses the top-most sheet if omitted.

### `dismissAll`

```ts
navigation.dismissAll()
```

Dismisses all active sheets.

## Notification methods

### `notify`

```ts
navigation.notify(element, options?)
```

Shows a notification and returns its key.

`options` is the same `NotificationOptions` used by `@rn-tools/notifications`:
- `id?`
- `position?` (`"top"` | `"bottom"`)
- `durationMs?`

### `dismissNotification`

```ts
navigation.dismissNotification(target?)
```

Dismisses a notification by key/id, lane (`"top"` or `"bottom"`), or the latest top-lane notification when omitted.

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
        onPress={() => navigation.push(<Detail />, { id: "detail" })}
      />
      <Button
        title="Present sheet"
        onPress={() =>
          navigation.present(
            <View style={{ padding: 24 }}>
              <Text>Sheet content</Text>
            </View>,
            { id: "edit", snapPoints: [320, 520] },
          )
        }
      />
      <Button title="Dismiss sheet" onPress={() => navigation.dismiss()} />
    </View>
  );
}

function Detail() {
  return (
    <View>
      <Button title="Back" onPress={() => navigation.pop()} />
    </View>
  );
}
```
