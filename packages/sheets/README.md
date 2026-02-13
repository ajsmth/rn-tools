# @rn-tools/sheets

Native bottom sheets for React Native + Expo with iOS `UISheetPresentationController` and Android `BottomSheetDialog`.

## Install

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

Then rebuild the native app.

## APIs

This package supports two usage styles:

1. Declarative `BottomSheet`
2. Store-driven `createSheets` + `SheetsProvider`

### Declarative `BottomSheet`

```tsx
import * as React from "react";
import { Button, View } from "react-native";
import { BottomSheet } from "@rn-tools/sheets";

export default function Example() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Button title="Open" onPress={() => setIsOpen(true)} />

      <BottomSheet
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        snapPoints={[300, 500]}
        initialIndex={0}
      >
        <View style={{ padding: 24 }}>{/* content */}</View>
      </BottomSheet>
    </View>
  );
}
```

### Store-driven sheets

Use this for imperative sheet presentation from anywhere in your app.
You do not need a hook for this pattern; you can call the external sheets store directly.

```tsx
import * as React from "react";
import { Button, View } from "react-native";
import { createSheets, SheetsProvider } from "@rn-tools/sheets";

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

function SheetContent() {
  return <View style={{ padding: 24 }} />;
}
```

`useSheets()` is still available when you prefer resolving the client from context.

## `createSheets` client

```ts
type SheetsClient = {
  store: SheetsStore;
  present: (element: React.ReactElement, options?: SheetOptions) => string;
  dismiss: (id?: string) => void;
  dismissAll: () => void;
};
```

- `present` returns a sheet key.
- `options.id` lets you target a logical sheet instance.
- `dismiss(id?)` closes by key/id, or top-most if omitted.
- `dismissAll()` closes all active sheets.

## `BottomSheet` props

- `isOpen`: whether the sheet should be open.
- `setIsOpen(next)`: called when native requests a visibility change.
- `snapPoints?: number[]`: snap heights (dp). Android uses first 2 only.
- `initialIndex?: number`: initial snap point index.
- `canDismiss?: boolean`: allow swipe/back dismissal (default `true`).
- `onDismissPrevented?: () => void`: called when dismissal is blocked.
- `onStateChange?: (event) => void`: emits `{ type: "OPEN" }` and `{ type: "HIDDEN" }`.
- `containerStyle?: ViewStyle`
- `appearanceIOS?: { grabberVisible?: boolean; backgroundColor?: string; cornerRadius?: number }`
- `appearanceAndroid?: { dimAmount?: number; backgroundColor?: string; cornerRadius?: number }`

## Notes

- If `snapPoints` is omitted, the sheet auto-sizes to measured content height.
- On Android, nested scroll content should use `nestedScrollEnabled` where needed.
- iOS uses an overlay window to host the presented sheet.
