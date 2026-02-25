# @rn-tools/notifications

Native notification overlays for React Native apps.

## Installation

```bash
yarn expo install @rn-tools/notifications
```

## Quick Start

```tsx
import * as React from "react";
import { Button, Text, View } from "react-native";
import {
  createNotifications,
  NotificationsProvider,
  type NotificationInjectedProps,
} from "@rn-tools/notifications";

const notifications = createNotifications();

export default function App() {
  return (
    <NotificationsProvider notifications={notifications}>
      <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
        <Button
          title="Notify"
          onPress={() =>
            notifications.show(
              <NotificationCard message="Saved successfully" />,
              { id: "saved", position: "top", durationMs: 3000 },
            )
          }
        />
      </View>
    </NotificationsProvider>
  );
}

function NotificationCard({
  message,
  dismiss,
}: { message: string } & NotificationInjectedProps) {
  return (
    <View style={{ padding: 12, backgroundColor: "#111827", borderRadius: 12 }}>
      <Text style={{ color: "white" }}>{message}</Text>
      <Button title="Dismiss" onPress={dismiss} />
    </View>
  );
}
```

## API

### `createNotifications`

```ts
const notifications = createNotifications(renderTreeStore?);
```

Creates a `NotificationsClient`.

### `NotificationsProvider`

```tsx
<NotificationsProvider notifications={notifications}>
  {children}
</NotificationsProvider>
```

Mounts the native notification host and lane containers.

## `NotificationsClient`

```ts
type NotificationsClient = {
  show: (element: React.ReactElement, options?: NotificationOptions) => string;
  dismiss: (target?: NotificationDismissTarget) => void;
  dismissAll: () => void;
  remove: (id: string) => void;
};
```

```ts
type NotificationInjectedProps = {
  dismiss?: () => void;
};
```

### `show(element, options?)`

Presents a notification and returns its key.

`NotificationOptions`:
- `id?`: stable id to replace/reuse an existing notification key.
- `position?`: `"top"` (default) or `"bottom"`.
- `durationMs?`: auto-dismiss duration in ms.
- each rendered element receives an injected optional `dismiss?: () => void` prop.

### `dismiss(target?)`

Dismisses by:
- key/id string
- lane: `"top"` or `"bottom"` (latest non-closing in that lane)
- omitted target: latest non-closing top-lane notification

### `dismissAll()`

Dismisses all active notifications.

## Hooks

### `useNotifications()`

Returns the current `NotificationsClient` from context.

### `useNotificationEntry()`

Returns controls scoped to the currently rendered notification entry:

```ts
const { entryKey, dismiss, dismissAll } = useNotificationEntry();
```

Use this as a fallback when prop injection is not convenient.

## Using with `@rn-tools/navigation`

`@rn-tools/navigation` mounts notifications internally. If you already use `Navigation`, call:

```ts
navigation.notify(element, options?);
navigation.dismissNotification(target?);
```
