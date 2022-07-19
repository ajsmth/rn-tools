# @rn-toolkit/tailwind

A babel plugin to enhance react-native primitives with tailwind classnames.

## Setup

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

(Optional) Add a `tailwind.config.js` file alongside your `babel.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      color: {
        awesome: "aquamarine",
      },
    },
  },
};
```

**Note**: Clear the cache and restart metro after making changes to `tailwind.config.js`

(Optional) Add a `tailwind.d.ts` somewhere in your project:

```ts
/// <reference types="@rn-toolkit/tailwind/types" />
```

## Usage

```tsx
import { View, Text } from "react-native";

function MyApp() {
  return (
    <View styles="p-12 flex-1 justify-center items-center bg-red-500">
      <Text styles="text-lg font-bold text-white">Hi there.</Text>
    </View>
  );
}
```

## Support

This package is designed to support React Native styles only.

## Acknowledgements

For the general idea (of course) [`tailwindcss`](https://github.com/tailwindlabs/tailwindcss) - more specifically this package uses the regexes to detect classnames in files

The initial iteration of this package provided a runtime function that read from a generated style sheet - this was inspired by the [`tailwind-rn`](https://github.com/vadimdemedes/tailwind-rn) package which took a similar approach

Recently, the [`nativewind`](https://github.com/marklawlor/nativewind) package developed a babel plugin that could add styles at build time instead - I used a ton of that repo as a reference for this plugin
