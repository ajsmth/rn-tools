import * as React from "react";
import { ViewStyle, View } from "react-native";

type NativeLaneProps = {
  children?: React.ReactNode;
  height?: number;
};

export const NativeTopLane = React.memo(function NativeTopLane({
  children,
  height = 0,
}: NativeLaneProps) {
  const style: ViewStyle = React.useMemo(() => {
    return {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: height,
    };
  }, [height]);

  return (
    <View style={style} pointerEvents="box-none">
      {children}
    </View>
  );
});

export const NativeBottomLane = React.memo(function NativeBottomLane({
  children,
  height = 0,
}: NativeLaneProps) {
  const style: ViewStyle = React.useMemo(() => {
    return {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: height,
    };
  }, [height]);

  return (
    <View pointerEvents="box-none" style={style}>
      {children}
    </View>
  );
});
