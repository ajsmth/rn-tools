import TailwindWrapper from "@rn-tools/tailwind";
import * as React from "react";
import { View, Text } from "react-native";

function MyComponent() {
  const textProps = {
    styles: "font-medium",
  };
  return (
    <TailwindWrapper styles="flex-1" component={View} styleSheet={styleSheet}>
      <Text>Hi.</Text>
    </TailwindWrapper>
  );
}

const styleSheet = {
  "font-medium": {
    fontWeight: "500",
  },
  "flex-1": {
    flex: 1,
  },
};
