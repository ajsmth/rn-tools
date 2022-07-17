import TailwindWrapper from "@rn-toolkit/tailwind";
import * as React from "react";
import { View, Text } from "react-native";

function MyComponent() {
  const textProps = {
    styles: "font-medium",
  };
  return (
    <TailwindWrapper styles="flex-1" component={View} styleSheet={styleSheet}>
      <TailwindWrapper {...textProps} component={Text} styleSheet={styleSheet}>
        Hi.
      </TailwindWrapper>
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
