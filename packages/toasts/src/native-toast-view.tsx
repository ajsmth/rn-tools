import * as React from "react";
import { StyleSheet } from "react-native";
import { requireNativeViewManager } from "expo-modules-core";
import type { ViewProps } from "react-native";

type NativeHostProps = ViewProps & {
  isVisible: boolean;
  debugLayout?: boolean;
  topItemCount?: number;
  bottomItemCount?: number;
};

const NativeToastsHostView =
  requireNativeViewManager<NativeHostProps>("RNToolsToasts");

export function ToastHost({
  isVisible,
  debugLayout = false,
  topItemCount = 0,
  bottomItemCount = 0,
}: {
  isVisible: boolean;
  debugLayout?: boolean;
  topItemCount?: number;
  bottomItemCount?: number;
}) {
  return (
    <NativeToastsHostView
      style={styles.host}
      isVisible={true}
      debugLayout={debugLayout && __DEV__}
      topItemCount={topItemCount}
      bottomItemCount={bottomItemCount}
      pointerEvents="none"
      collapsable={false}
    />
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
});
