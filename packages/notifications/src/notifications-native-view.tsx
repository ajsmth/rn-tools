import * as React from "react";
import { ViewStyle, View } from "react-native";
import { useSafeAreaInsets } from "@rn-tools/core";

type NativeLaneProps = {
  children?: React.ReactNode;
  height?: number;
};

export const NativeTopLane = React.memo(function NativeTopLane({
  children,
  height = 280,
}: NativeLaneProps) {
  const { top } = useSafeAreaInsets();

  const style: ViewStyle = React.useMemo(() => {
    return {
      position: "absolute",
      top: top,
      left: 0,
      right: 0,
      height: height,
    };
  }, [height, top]);

  return (
    <View style={style} pointerEvents="box-none">
      {children}
    </View>
  );
});

export const NativeBottomLane = React.memo(function NativeBottomLane({
  children,
  height = 280,
}: NativeLaneProps) {
  const { bottom } = useSafeAreaInsets();

  const style: ViewStyle = React.useMemo(() => {
    return {
      position: "absolute",
      bottom: bottom,
      left: 0,
      right: 0,
      height: height,
    };
  }, [height, bottom]);

  return (
    <View pointerEvents="box-none" style={style}>
      {children}
    </View>
  );
});
