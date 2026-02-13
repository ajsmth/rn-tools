# Navigation

Root component and client for the `@rn-tools/navigation` system.

`Navigation` provides context for `Stack` and `Tabs`, and now also mounts sheet support internally so you can present sheets directly from the navigation client.

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

  push: (element: React.ReactElement, options?: PushOptions) => void;
  pop: (options?: { stack?: string }) => void;
  tab: (index: number, options?: { tabs?: string }) => void;

  present: (element: React.ReactElement, options?: SheetOptions) => string;
  dismiss: (id?: string) => void;
  dismissAll: () => void;
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
