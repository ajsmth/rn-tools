# @rn-tools/sheets

Native bottom sheets for React Native + Expo built on iOS `UISheetPresentationController` and Android `BottomSheetDialog`.

## Setup

Install the package and the Expo build-properties plugin, then enable iOS 16.0:

```bash
yarn add @rn-tools/sheets expo-build-properties
```

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

Rebuild the native app so the sheet module is linked, then create a shared client once and wrap your root tree:

```tsx
import { createSheets } from "@rn-tools/sheets";

const sheets = createSheets();

export function App({ children }) {
  return <sheets.Provider>{children}</sheets.Provider>;
}
```

## Declarative Sheets

Use `<Sheet>` components for sheets that are always part of the tree. They register with the client when the provider mounts, so you control them via the shared `sheets` instance:

```tsx
<sheets.Provider>
  <Button title="Open settings" onPress={() => sheets.open("settings")} />
  <Sheet id="settings" snapPoints={[320, 520]}>
    <View style={{ padding: 24 }}>{/* content */}</View>
  </Sheet>
</sheets.Provider>
```

Call `sheets.open("settings")`, `sheets.dismiss("settings")` to show or hide it.

## Stack-driven Sheets

Use the same client to push sheet content

```tsx
  <Button
    title="Present sheet"
    onPress={() => {
      sheets.present(<SheetContent />, {
        id: "edit",
        snapPoints: [320, 520],
      });
    }}
  />
```

`present` returns a key, `dismiss(id?)` closes that key (or the most recent sheet when no id is supplied), and `dismissAll()` closes everything.

## Client API

```ts
type SheetsClient = {
  present: (element: React.ReactElement, options?: SheetOptions) => string;
  open: (id: string) => void;
  dismiss: (id?: string) => void;
  dismissAll: () => void;
};
```

`present` accepts `options.id`, `snapPoints`, `initialIndex`, `containerStyle`, and appearance overrides. 

## Sheet props

- `id`: unique identifier matched by `open`/`dismiss`.
- `snapPoints?: number[]`: heights in dp (Android uses two entries).
- `initialIndex?: number`: initial snap point index.
- `canDismiss?: boolean`: allow swipe/back gestures (default `true`).
- `onDismissPrevented?: () => void`: fired when dismissal is rejected.
- `onStateChange?: (event: SheetChangeEvent) => void`: emits `{ type: "OPEN" }` and `{ type: "HIDDEN" }`.
- `containerStyle?: ViewStyle`.
- `appearanceIOS?: { grabberVisible?: boolean; backgroundColor?: string; cornerRadius?: number }`.
- `appearanceAndroid?: { dimAmount?: number; backgroundColor?: string; cornerRadius?: number }`.
- `setIsOpen?: (isOpen: boolean) => void`: wired to the native sheet to react to state changes.
- `onDismissed?: () => void`: invoked once the native view hides.


## Notes

- If `snapPoints` is omitted, the sheet auto-sizes to the measured content height.
- On Android, nested scroll content should use `nestedScrollEnabled` where necessary.
- iOS uses an overlay window to host the presented sheet.
