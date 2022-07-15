# @rn-toolkit/ui

An alternative way to manage native UI elements

## Installation

```bash
yarn add @rn-tookit/ui
```

Install the required dependencies if you dont have them already

```bash
yarn add react-native-gesture-handler react-native-reanimated
```

## Usage

Creating a `BottomSheet` provider:

```tsx
import * as React from "react";

import { createBottomSheetProvider } from "@rn-toolkit/ui";

const BottomSheet = createBottomSheetProvider();

function MyApp() {
  return (
    <BottomSheet.Provider>
      <App />
    </BottomSheet.Provider>
  );
}

BottomSheet.push(SomeBottomSheetComponent, {
  snapPoints: [400, 600],
});
```

Creating a `Modal` provider:

```tsx
import * as React from "react";

import { createModalProvider } from "@rn-toolkit/ui";

const Modal = createModalProvider();

function MyApp() {
  return (
    <Modal.Provider>
      <App />
    </Modal.Provider>
  );
}

Modal.push(MyModalComponent);
```

Creating a `Toast` provider:

```tsx
import * as React from "react";

import { createToastProvider } from "@rn-toolkit/ui";

const Toast = createToastProvider();

function MyApp() {
  return (
    <Toast.Provider>
      <App />
    </Toast.Provider>
  );
}

Toast.push(MyToastComponent, {
  duration: 1500,
});
```
