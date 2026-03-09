# @rn-tools/sheets

Native bottom sheets for React Native + Expo with iOS `UISheetPresentationController` and Android `BottomSheetDialog`.

## Setup

```bash
yarn add @rn-tools/sheets expo-build-properties
```

Set iOS deployment target to `16.0` in `app.json`:

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

Then rebuild the native app so the new sheet native module is linked.

## APIs

This package supports two usage styles:

1. Declarative `Sheet`
2. Stack driven sheets via the sheets.present API

### Declarative `Sheet`

```tsx
import * as React from "react";
import { Button, View } from "react-native";
import { Sheet, createSheets } from "@rn-tools/sheets";

const sheets = createSheets();

export default function Example() {
  return (
    <sheets.Provider>
      <Button title="Open sheet" onPress={() => sheets.open("settings")} />
      <Sheet id="settings" snapPoints={[320, 520]}>
        <View style={{ padding: 24 }}>{/* content */}</View>
      </Sheet>
    </sheets.Provider>
  );
}
```

### Stack-driven sheets

Use this for imperative sheet presentation from anywhere in your app.

```tsx
import * as React from "react";
import { Button, View } from "react-native";
import {
  createSheets,
  SheetsProvider,
  type SheetInjectedProps,
} from "@rn-tools/sheets";

const sheets = createSheets();

export default function App() {
  return (
    <SheetsProvider sheets={sheets}>
      <Screen />
    </SheetsProvider>
  );
}

function Screen() {
  return (
    <View>
      <Button
        title="Present"
        onPress={() => {
          sheets.present(<SheetContent />, {
            id: "edit",
            snapPoints: [320, 520],
          });
        }}
      />
      <Button title="Dismiss" onPress={() => sheets.dismiss()} />
      <Button title="Dismiss all" onPress={() => sheets.dismissAll()} />
    </View>
  );
}

function SheetContent({ dismiss }: SheetInjectedProps) {
  return (
    <View style={{ padding: 24 }}>
      <Button title="Dismiss" onPress={() => dismiss?.()} />
    </View>
  );
}


## `createSheets` client

```ts
type SheetsClient = {
  store: SheetsStore;
  present: (element: React.ReactElement, options?: SheetOptions) => string;
  open: (id: string) => void;
  dismiss: (id?: string) => void;
  dismissAll: () => void;
};
```

```ts
type SheetInjectedProps = {
  dismiss?: () => void;
};
```

- `present` returns a sheet key.
- `options.id` lets you target a logical sheet instance.
- `options` also accepts `snapPoints`, `initialIndex`, `appearanceIOS`, `appearanceAndroid`, and `containerStyle` to configure the native sheet.
- `dismiss(id?)` closes by key/id, or top-most if omitted.
- `dismissAll()` closes all active sheets.
- `open(id)` marks a declarative `<Sheet id="...">` node as open so it reuses the registered sheet instead of presenting a new element.

## `Sheet` props

- `id`: unique identifier so the tree and store can target it.
- `snapPoints?: number[]`: snap heights (dp). Android uses the first two entries only.
- `initialIndex?: number`: initial snap point index before the sheet is shown.
- `canDismiss?: boolean`: allow swipe/back dismissal (default `true`).
- `onDismissPrevented?: () => void`: called when dismissal is blocked.
- `onStateChange?: (event: SheetChangeEvent) => void`: emits `{ type: "OPEN" }` and `{ type: "HIDDEN" }`.
- `containerStyle?: ViewStyle`.
- `appearanceIOS?: { grabberVisible?: boolean; backgroundColor?: string; cornerRadius?: number }`.
- `appearanceAndroid?: { dimAmount?: number; backgroundColor?: string; cornerRadius?: number }`.
- `setIsOpen?: (isOpen: boolean) => void`: notified when the native sheet requests a change; typically passed through from the store-driven client so it can close gracefully.
- `onDismissed?: () => void`: invoked when the native view finishes dismissing.

## Notes

- If `snapPoints` is omitted, the sheet auto-sizes to measured content height.
- On Android, nested scroll content should use `nestedScrollEnabled` where needed.
- iOS uses an overlay window to host the presented sheet.
