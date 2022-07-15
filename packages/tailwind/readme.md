# @rn-toolkit/tailwind

A babel plugin to enhance react-native primitives with your custom tailwind theme

## Install

```bash
yarn add @rn-toolkit/tailwind
```

Update your project babel config:

```js
// babel.config.js
module.exports = {
  plugins: ["@rn-toolkit/tailwind/babel"],
};
```

## Usage

```tsx
import { View, Text } from "react-native";

function MyApp() {
  return (
    <View className="p-12 flex-1 justify-center items-center bg-red-500">
      <Text className="text-lg font-bold text-white">Hi there.</Text>
    </View>
  );
}
```

## Selectors

```tsx
import { View, Text } from "react-native";

function MyApp() {
  return (
    <View
      className="flex-1 justify-center items-center"
      selectors={{
        dark: "bg-red-500",
        light: "bg-blue-500",
      }}
    >
      <Text className="text-lg font-bold text-white">Hi there.</Text>
    </View>
  );
}
```
