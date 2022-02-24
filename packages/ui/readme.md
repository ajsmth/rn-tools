# @rn-toolkit/ui

## Installation

```bash
yarn add @rn-tookit/ui
```

Install the required dependencies if you dont have them already

```bash
yarn add react-native-screens react-native-gesture-handler react-native-reanimated
```

## Usage

Wrap your app in the `<Container />` component

```tsx
// App.tsx
import * as React from "react";

import { Container } from "@rn-toolkit/ui";

function App() {
  return (
    <Container>
      <MyApp />
    </Container>
  );
}
```

Now you can push a new screen:

```tsx
import * as React from "react";
import { View, Text } from "react-native";

import { Stack } from "@rn-toolkit/ui";

function MyScreen() {
  return (
    <View style={{ backgroundColor: "white", flex: 1 }}>
      <Text>Hi</Text>
    </View>
  );
}

Stack.push(MyScreen, { headerProps: { title: "Hi" } });
```

...or use a bottom sheet:

```tsx
import * as React from "react";
import { View, Text } from "react-native";

import { BottomSheet } from "@rn-toolkit/ui";

function MyBottomSheet() {
  return (
    <View style={{ backgroundColor: "white", flex: 1, padding: 16 }}>
      <Text>Hi</Text>
    </View>
  );
}

BottomSheet.push(MyBottomSheet, {
  snapPoints: [400, 600],
});
```

...or a modal:

```tsx
// App.tsx
import * as React from "react";
import { Button, View, Text } from "react-native";

import { Modal } from "@rn-toolkit/ui";

function MyModal() {
  return (
    <View style={{ backgroundColor: "white", padding: 16 }}>
      <Text>Hi</Text>
    </View>
  );
}

Modal.push(MyModal);
```

...or a toast:

```tsx
// App.tsx
import * as React from "react";
import { Button, View, Text } from "react-native";

import { Toast } from "@rn-toolkit/ui";

function MyToast() {
  return (
    <View style={{ backgroundColor: "white", padding: 16 }}>
      <Text>Hi</Text>
    </View>
  );
}

Toast.push(MyToast, {
  duration: 1500,
});
```

### Create a new stack

Sometimes you'll want to have separate stacks for different parts of your app:

```tsx
import { createStack } from "@rn-toolkit/ui";

export const MyStack = createStack();

function App() {
  return (
    <MyStack.Container>
      <MyApp />
    </MyStack.Container>
  );
}
```

...now you can use that stack anywhere you'd like

```tsx
import { MyStack } from "./app";

function navigateToHome() {
  MyStack.push(Home, { headerProps: { title: "Hi" } });
}
```
