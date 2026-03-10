# @rn-tools/notifications

Native notification overlays for React Native + Expo apps.

## Setup

Install the package, create a shared client once, then wrap your app with the generated provider:

```bash
yarn expo install @rn-tools/notifications
```

```tsx
import { createNotifications } from "@rn-tools/notifications";

const notifications = createNotifications();

export function App({ children }) {
  return <notifications.Provider>{children}</notifications.Provider>;
}
```

## Present Notifications

Use the shared client anywhere in your app to present overlay content in the top or bottom lane:

```tsx
import { Button, Text, View } from "react-native";

<Button
  title="Show notification"
  onPress={() => {
    notifications.present(
      <View
        style={{
          padding: 12,
          borderRadius: 12,
          backgroundColor: "#111827",
        }}
      >
        <Text style={{ color: "white" }}>Saved successfully</Text>
      </View>,
      {
        id: "saved",
        position: "top",
        durationMs: 3000,
      },
    );
  }}
/>
```

Call `notifications.dismiss()` to close the active notification, `notifications.dismiss("saved")` to target a specific one, or `notifications.dismissAll()` to clear everything.

`present()` returns the notification id, so you can keep the generated key when you need to dismiss it later.

## Bottom Lane Notifications

Use `position: "bottom"` when the notification should slide up from the bottom edge:

```tsx
notifications.present(<UndoToast />, {
  id: "undo-delete",
  position: "bottom",
  durationMs: null,
  onPress: () => undoDelete(),
});
```

Persistent notifications use `durationMs: null`. Pressing a notification closes it before running `onPress`.

## Client API

```ts
type NotificationsClient = {
  present: (element: React.ReactElement, options?: NotificationOptions) => string;
  dismiss: (id?: string) => void;
  dismissAll: () => void;
  Provider: React.ComponentType<{ children: React.ReactNode }>;
};
```

`present` accepts the rendered element plus `options.id`, `position`, `durationMs`, and `onPress`, and returns the notification id.

## Notification options

- `id?: string`: stable identifier to dismiss a specific notification later.
- `position?: "top" | "bottom"`: lane to render into. Defaults to `"top"`.
- `durationMs?: number | null`: auto-dismiss delay in ms. Defaults to `3000`. Use `null` to keep it visible.
- `onPress?: () => void`: invoked after the notification is tapped and dismissed.

## Using with `@rn-tools/navigation`

`@rn-tools/navigation` mounts notifications internally. If you already use `Navigation`, call the same client methods through the navigation instance:

```ts
navigation.notifications.present(element, options?);
navigation.notifications.dismiss(id?);
navigation.notifications.dismissAll();
```

## Notes

- Notifications render in native top and bottom overlay lanes.
- If `dismiss()` is called without an id, it closes the currently active notification.
