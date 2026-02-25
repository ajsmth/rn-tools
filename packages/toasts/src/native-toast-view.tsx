import * as React from "react";
import { StyleSheet } from "react-native";
import { requireNativeViewManager } from "expo-modules-core";
import type { ViewProps } from "react-native";

type NativeHostProps = ViewProps & {
  children?: React.ReactNode;
  debugLayout?: boolean;
};

const NativeToastsHostView =
  requireNativeViewManager<NativeHostProps>("RNToolsToasts");

const NativeToastsTopLaneView =
  requireNativeViewManager<ViewProps>("RNToolsToastsTopLane");
const NativeToastsBottomLaneView =
  requireNativeViewManager<ViewProps>("RNToolsToastsBottomLane");

export function ToastHost({
  debugLayout = false,
  children,
}: {
  debugLayout?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <NativeToastsHostView
      style={styles.host}
      debugLayout={debugLayout && __DEV__}
      pointerEvents="box-none"
      collapsable={false}
    >
      {children}
    </NativeToastsHostView>
  );
}

type NativeLaneProps = {
  children?: React.ReactNode;
};

export const NativeTopLane = React.memo(function NativeTopLane({
  children,
}: NativeLaneProps) {
  return (
    <NativeToastsTopLaneView
      collapsable={false}
      pointerEvents="box-none"
      style={styles.lane}
    >
      {children}
    </NativeToastsTopLaneView>
  );
});

export const NativeBottomLane = React.memo(function NativeBottomLane({
  children,
}: NativeLaneProps) {
  return (
    <NativeToastsBottomLaneView
      collapsable={false}
      pointerEvents="box-none"
      style={styles.lane}
    >
      {children}
    </NativeToastsBottomLaneView>
  );
});

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  lane: {
    ...StyleSheet.absoluteFillObject,
  },
});
