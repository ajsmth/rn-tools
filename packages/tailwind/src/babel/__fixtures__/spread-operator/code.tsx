import * as React from "react";
import { View, Text, BottomSheet } from "react-native";

function MyComponent() {
  const bottomSheetProps = { styles: "bg-white" };
  const onChange = () => {};
  return (
    <BottomSheet
      enablePanDownToClose
      {...bottomSheetProps}
      onChange={onChange}
    />
  );
}
