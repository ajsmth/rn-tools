# @rn-toolkit/ui-services

## Installation

```bash
yarn add @rn-tookit/ui-services
```

Install the required dependencies if you dont have them already

```bash
yarn add react-native-screens react-native-gesture-handler react-native-reanimated
```

## Usage

Wrap your app in the `<UIServicesProvider />` component

```tsx
// App.tsx
import * as React from "react";

import { UIServicesProvider } from "@rn-toolkit/ui-services";

function App() {
  return (
    <UIServicesProvider>
      <MyApp />
    </UIServicesProvider>
  );
}
```

Now you can push a new screen:

```tsx
import * as React from "react";
import { View, Text } from "react-native";

import { Stack } from "@rn-toolkit/ui-services";

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

import { BottomSheet } from "@rn-toolkit/ui-services";

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

import { Modal } from "@rn-toolkit/ui-services";

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

import { Toast } from "@rn-toolkit/ui-services";

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
