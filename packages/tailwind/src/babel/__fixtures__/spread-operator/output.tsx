import TailwindWrapper from "@rn-toolkit/tailwind";
import * as React from "react";
import { View, Text, BottomSheet } from "react-native";

function MyComponent() {
  const bottomSheetProps = {
    styles: "bg-white",
  };

  const onChange = () => {};

  return (
    <TailwindWrapper
      enablePanDownToClose
      {...bottomSheetProps}
      onChange={onChange}
      component={BottomSheet}
      styleSheet={styleSheet}
    />
  );
}

const styleSheet = {
  "bg-white": {
    backgroundColor: "#fff",
  },
};
