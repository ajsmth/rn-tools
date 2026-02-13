# Stack

Stack navigation component built on `react-native-screens`. Manages a stack of screens where only the top screen is active, with support for imperative push and pop operations.

## Basic Usage

```tsx
import { Stack } from "@rn-tools/navigation";

function App() {
  return <Stack id="main-stack" rootScreen={<HomeScreen />} />;
}
```

## Props

### `StackProps`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | — | Identifier for this stack instance in the navigation store. |
| `active` | `boolean` | `true` | Whether the stack is considered active in the render tree. |
| `rootScreen` | `React.ReactElement` | — | The initial screen rendered at the bottom of the stack. |

## Types

### `PushOptions`

Options passed when pushing a screen onto the stack.

```ts
type PushOptions = {
  id?: string;
  stack?: string;
};
```

| Field | Description |
|-------|-------------|
| `id` | Unique identifier for the screen. Prevents duplicate screens with the same ID from being pushed. |
| `stack` | Explicitly target a specific stack. When omitted, the deepest active stack is used. |

### `StackHandle`

Ref handle exposed by the `Stack` component.

```ts
type StackHandle = {
  push: (element: React.ReactElement, options?: PushOptions) => void;
  pop: () => void;
};
```

| Method | Description |
|--------|-------------|
| `push(element, options?)` | Push a screen onto this stack. Supports duplicate prevention via `options.id`. |
| `pop()` | Pop the top screen from this stack. |

## Ref Usage

Use a ref to push and pop screens imperatively:

```tsx
import { useRef } from "react";
import { Stack, type StackHandle } from "@rn-tools/navigation";

function App() {
  const stackRef = useRef<StackHandle>(null);

  return (
    <>
      <Stack ref={stackRef} id="main-stack" rootScreen={<HomeScreen />} />
      <Button
        title="Open Detail"
        onPress={() =>
          stackRef.current?.push(<DetailScreen />, { id: "detail" })
        }
      />
      <Button
        title="Go Back"
        onPress={() => stackRef.current?.pop()}
      />
    </>
  );
}
```

## Pushing and Popping via Navigation

Screens can also be managed through the `navigation` object returned by `createNavigation`:

```tsx
const navigation = createNavigation();

// Push onto the deepest active stack
navigation.push(<DetailScreen />);

// Push onto a specific stack
navigation.push(<DetailScreen />, { id: "detail", stack: "main-stack" });

// Pop from the deepest active stack
navigation.pop();

// Pop from a specific stack
navigation.pop({ stack: "main-stack" });
```

## Duplicate Prevention

When pushing a screen with an `id`, the stack will skip the push if a screen with the same ID already exists:

```tsx
// First push succeeds
navigation.push(<DetailScreen />, { id: "detail", stack: "main-stack" });

// Second push is ignored — "detail" already exists on the stack
navigation.push(<DetailScreen />, { id: "detail", stack: "main-stack" });
```

Once the screen is popped, it can be pushed again with the same ID.

## Preloading Screens

Set initial stack screens through the navigation state when creating the navigation instance:

```tsx
const navigation = createNavigation({
  stacks: {
    "main-stack": [
      {
        element: <DetailScreen />,
        options: { id: "detail" },
      },
    ],
  },
});
```

## Nesting Stacks

Stacks can be nested. When calling `navigation.push()` without an explicit `stack`, it targets the deepest active stack:

```tsx
function App() {
  return (
    <Stack id="outer" rootScreen={<Stack id="inner" rootScreen={<HomeScreen />} />} />
  );
}

// Targets "inner" — the deepest active stack
navigation.push(<DetailScreen />);
```

If a parent stack becomes inactive, push operations fall back to the next deepest active stack.
