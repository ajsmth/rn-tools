import * as React from "react";
import { View, Text } from "react-native";

export default function App() {
  const textStyle = {
    styles: "text-xl font-bold",
  };
  return (
    <View styles="absolute bg-awesome inset-2 justify-center">
      <Text {...textStyle}>Hi.</Text>
    </View>
  );
}
