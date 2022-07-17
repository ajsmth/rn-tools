import * as React from "react";
import { View, Text } from "react-native";

function MyComponent() {
  const textProps = { styles: "font-medium" };
  return (
    <View styles="flex-1">
      <Text {...textProps}>Hi.</Text>
    </View>
  );
}
