import * as React from "react";
import { requireNativeViewManager } from "expo-modules-core";
import { Text, View, ViewStyle, StyleSheet } from "react-native";

type NativeTabViewProps = {
  style: ViewStyle;
  children?: React.ReactNode;
};

const NativeView: React.ComponentType<NativeTabViewProps> =
  requireNativeViewManager("RNToolsTabs");

type NativeTabScreenProps = {
  label: string;
  style: ViewStyle;
  children?: React.ReactNode;
};

const NativeScreenContainerView: React.ComponentType<NativeTabScreenProps> =
  requireNativeViewManager("RNToolsTabScreen");

export function Tabs2(props: NativeTabViewProps) {
  return (
    <NativeView style={{ ...StyleSheet.absoluteFillObject }}>
      <NativeScreenContainerView
        style={{ ...StyleSheet.absoluteFillObject }}
        label="Hi"
      >
        <Text>Hi</Text>
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: "blue" }} />
          <View style={{ flex: 1, backgroundColor: "yellow" }} />
        </View>
      </NativeScreenContainerView>

      <NativeScreenContainerView
        style={{ ...StyleSheet.absoluteFillObject }}
        label="Hey"
      >
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: "purple" }} />
          <View style={{ flex: 1, backgroundColor: "pink" }} />
        </View>
      </NativeScreenContainerView>

      <NativeScreenContainerView
        style={{ ...StyleSheet.absoluteFillObject }}
        label="Hello"
      >
        <View style={{ flex: 1, backgroundColor: "green" }} />
        <View style={{ flex: 1, backgroundColor: "orange" }} />
      </NativeScreenContainerView>
    </NativeView>
  );
}
