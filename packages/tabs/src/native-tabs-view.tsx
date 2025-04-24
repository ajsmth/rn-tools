import * as React from "react";
import { requireNativeViewManager } from "expo-modules-core";
import { View } from "react-native";

type NativeTabViewProps = {};

const NativeView: React.ComponentType<NativeTabViewProps> =
  requireNativeViewManager("RNToolsTabs");

export function Tabs2(props: NativeTabViewProps) {
  return (
    <NativeView style={{ flex: 1, backgroundColor: "blue" }}>
      <View style={{ flex: 1, backgroundColor: "red" }} />
      <View style={{ flex: 1, backgroundColor: "purple" }} />
      <View style={{ flex: 1, backgroundColor: "yellow" }} />
    </NativeView>
  );
}
