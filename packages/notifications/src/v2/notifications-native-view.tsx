import * as React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "@rn-tools/core";

type NativeLaneProps = {
  children?: React.ReactNode;
};

export const NativeTopLane = React.memo(function NativeTopLane({
  children,
}: NativeLaneProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: "absolute",
        top: insets.top,
        left: 0,
        right: 0,
        height: 280,
      }}
      pointerEvents="box-none"
    >
      {children}
    </View>
  );
});

export const NativeBottomLane = React.memo(function NativeBottomLane({
  children,
}: NativeLaneProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        bottom: insets.bottom,
        left: 0,
        right: 0,
        height: 280,
      }}
    >
      {children}
    </View>
  );
});
